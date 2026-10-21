// =============================================================
// 『箱庭に注がれた甘美な蜜』 エンド判定ツール
//   判定ルールはシナリオ本文「エンド分岐のための確認処理」
//   「全体エンド分岐」「個別エンド分岐」に準拠しています。
//   本文データは endings.js にあります。
// =============================================================
(function () {
    'use strict';

    const HOS = [1, 2, 3, 4];
    const CULPRIT_LABEL = { HO1: 'HO1', HO2: 'HO2', HO3: 'HO3', HO4: 'HO4', mita: '三田／第三者', none: 'なし' };

    // ---------- 小物 ----------
    const $ = (id) => document.getElementById(id);
    const radio = (name) => {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : null;
    };
    const checked = (id) => $(id).checked;

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getNames() {
        const names = {};
        HOS.forEach((n) => {
            const v = $(`name_ho${n}`).value.trim();
            names[n] = v || `HO${n}`;
        });
        return names;
    }

    // {HO1}〜{HO4} を名前に置換（HTMLエスケープ済みで返す）
    function fill(text, names) {
        return escapeHtml(text).replace(/\{HO([1-4])\}/g, (_, n) => escapeHtml(names[n]));
    }
    function fillPlain(text, names) {
        return String(text).replace(/\{HO([1-4])\}/g, (_, n) => names[n]);
    }

    // ---------- 入力の読み取り ----------
    function readInput() {
        return {
            battle: radio('battle'),
            status: {
                1: radio('ho1_status'),
                2: radio('ho2_status'),
                3: radio('ho3_status'),
                4: radio('ho4_status')
            },
            ho1Broken: checked('ho1_broken'),
            ho2Broken: checked('ho2_broken'),
            culprit: radio('culprit'),
            sd: checked('sd_reported'),
            ho2Choice: radio('ho2_choice'),
            ho2Confess: checked('ho2_confess'),
            ho2Volunteer: checked('ho2_volunteer'),
            ho4OnHo1: radio('ho4_on_ho1'),
            ho4OnHo2: radio('ho4_on_ho2'),
            ho3OnHo2: radio('ho3_on_ho2'),
            ho2Pick: radio('ho2_pick'),
            ho3Solo: radio('ho3_solo')
        };
    }

    // =========================================================
    // 判定本体（DOMに依存しない純粋関数）
    // =========================================================
    function evaluate(inp) {
        const notes = [];
        const s = Object.assign({}, inp.status);

        const isDead = (n) => s[n] === 'lost' || s[n] === 'killed';
        const isPresent = (n) => s[n] === 'alive' || s[n] === 'surrender'; // 最後まで地下室にいる

        // --- 戦闘結果による補正 ---
        if (inp.battle === 'lose') {
            HOS.forEach((n) => { if (isPresent(n)) s[n] = 'lost'; });
        } else if (inp.battle === 'escape') {
            HOS.forEach((n) => { if (isPresent(n)) s[n] = 'escaped'; });
        }

        const defeated = inp.battle === 'defeat';

        // --- HO2「B：死を選ぶ」 ---
        if (defeated && isPresent(2) && !inp.ho2Broken && inp.ho2Choice === 'B') {
            s[2] = 'lost';
        }

        // --- HO3単独生存 ---
        const solo = defeated && isPresent(3) && [1, 2, 4].every(isDead);

        // --- 犯人の確定 ---
        const ho2Volunteered = defeated && isPresent(2) && !inp.ho2Broken && inp.ho2Volunteer;
        let culprit = defeated ? inp.culprit : 'none';
        if (ho2Volunteered) culprit = 'HO2';
        if (s[3] === 'surrender') culprit = 'HO3';
        if (solo) {
            if (inp.ho3Solo === 'A') { s[3] = 'surrender'; culprit = 'HO3'; }
            else if (culprit === 'HO3') culprit = 'mita'; // B/C は身代わりを立てる
        }
        const ho3Arrested = s[3] === 'alive' && culprit === 'HO3';

        // --- 精神崩壊したPCの処遇（有効な場合のみ） ---
        const fate = activeFates(inp, s, culprit);

        // 罪を着せられたPC
        const framed = new Set();
        if (['HO1', 'HO2', 'HO4'].includes(culprit) && !(culprit === 'HO2' && ho2Volunteered)) framed.add(culprit);
        if (fate.ho4OnHo1 === 'B') framed.add('HO1');
        if (fate.ho4OnHo2 === 'B' || fate.ho3OnHo2 === 'B') framed.add('HO2');

        // 監禁
        const ho1Caged = fate.ho4OnHo1 === 'C';
        let ho2CagedBy = null;
        const c4 = fate.ho4OnHo2 === 'C';
        const c3 = fate.ho3OnHo2 === 'C';
        if (c4 && c3) ho2CagedBy = inp.ho2Pick === 'HO3' ? 'HO3' : 'HO4';
        else if (c4) ho2CagedBy = 'HO4';
        else if (c3) ho2CagedBy = 'HO3';

        if (ho1Caged && framed.has('HO1')) {
            framed.delete('HO1');
            notes.push('HO1は「犯人として報告」と「監禁」が両方選ばれています。監禁を優先して判定しました（公には殉職扱い）。');
        }
        if (ho2CagedBy && framed.has('HO2')) {
            framed.delete('HO2');
            notes.push('HO2は「罪を着せる」と「監禁」が両方選ばれています。監禁を優先して判定しました。');
        }

        // HO3が罪の擦り付けに成功したか
        const ho3Free = s[3] === 'alive' && !ho3Arrested;
        const framingSuccess = ho3Free && (['HO1', 'HO2', 'HO4', 'mita'].includes(culprit) || framed.size > 0);

        // --- 全体END ---
        let overall;
        const anyPresent = HOS.some(isPresent);
        const anyEscaped = HOS.some((n) => s[n] === 'escaped');
        if (inp.battle === 'lose') overall = 'C';
        else if (inp.battle === 'escape') overall = 'D';
        else if (!anyPresent) {
            overall = anyEscaped ? 'D' : 'C';
            notes.push('「撃破した」になっていますが、地下室に残っているHOがいません。' + (anyEscaped ? '全員逃走（END D）' : '全滅（END C）') + 'として判定しました。');
        }
        else if (solo && inp.ho3Solo === 'B') overall = 'B';
        else if (inp.sd) overall = 'A';
        else overall = 'E';

        // 補正の告知
        HOS.forEach((n) => {
            if (inp.status[n] !== s[n]) {
                if (inp.battle === 'lose' && s[n] === 'lost') notes.push(`HO${n}は敗北によりロスト扱いになります。`);
                if (inp.battle === 'escape' && s[n] === 'escaped') notes.push(`HO${n}は全員逃走のため逃走扱いになります。`);
                if (n === 2 && s[n] === 'lost' && inp.ho2Choice === 'B' && defeated) notes.push('HO2は「B：死を選ぶ」によりロスト扱いになります。');
                if (n === 3 && s[n] === 'surrender' && solo) notes.push('HO3は単独生存時の「A：自首」により自首扱いになります。');
            }
        });
        if (ho2Volunteered && inp.culprit !== 'HO2') notes.push('HO2が自ら名乗り出たため、報告した犯人はHO2として扱いました。');
        if (inp.status[3] === 'surrender' && defeated && inp.culprit !== 'HO3') notes.push('HO3が自首したため、報告した犯人はHO3として扱いました。');

        // --- 個別END ---
        const ctx = { inp, s, culprit, framed, ho1Caged, ho2CagedBy, ho2Volunteered, ho3Arrested, framingSuccess, isDead, isPresent };
        const ind = {
            1: judgeHo1(ctx),
            2: judgeHo2(ctx),
            3: judgeHo3(ctx),
            4: judgeHo4(ctx)
        };

        return { overall, ind, notes, status: s, culprit };
    }

    // 処遇の選択肢が有効かどうか（UIの有効/無効とも共有）
    function activeFates(inp, s, culprit) {
        const defeated = inp.battle === 'defeat';
        const present = (n) => s[n] === 'alive' || s[n] === 'surrender';
        const ho3CanAct = s[3] === 'alive' && culprit !== 'HO3';
        const ho4OnHo1 = defeated && inp.ho1Broken && present(1) && present(4) ? inp.ho4OnHo1 : null;
        const ho4OnHo2 = defeated && inp.ho2Broken && present(2) && present(4) ? inp.ho4OnHo2 : null;
        const ho3OnHo2 = defeated && inp.ho2Broken && present(2) && ho3CanAct ? inp.ho3OnHo2 : null;
        return { ho4OnHo1, ho4OnHo2, ho3OnHo2 };
    }

    // ---------- HO1 ----------
    function judgeHo1(c) {
        const { s, culprit, inp } = c;
        if (c.isDead(1)) return { code: 6 };
        if (s[1] === 'escaped') return { code: 0 };
        if (c.ho1Caged) return { code: 5 };
        if (c.framed.has('HO1')) return { code: 4 };
        if (s[3] === 'killed') return { code: 2 };
        if (inp.sd && culprit === 'HO3') return { code: 1 };
        if (['HO2', 'HO4', 'mita'].includes(culprit)) return { code: 3 };
        if (culprit === 'HO3') return { code: 1, note: 'SDカード未提出のため厳密には条件外です。HO3の逮捕による決着としてEND 1を準用しています。' };
        if (inp.sd) return { code: 1, note: '犯人の報告がないため厳密には条件外です。SDカードによる告発としてEND 1を準用しています。' };
        return { code: null, note: '犯人の報告もSDカードの提出もないため、本編に該当する個別ENDがありません。KP裁量で描写してください。' };
    }

    // ---------- HO2 ----------
    function judgeHo2(c) {
        const { s, inp } = c;
        if (c.isDead(2)) return { code: 8 };
        if (s[2] === 'escaped') return { code: 0 };
        if (c.ho2CagedBy === 'HO3') return { code: 5 };
        if (c.ho2CagedBy === 'HO4') return { code: 6 };
        if (c.ho2Volunteered) return { code: 2 };
        if (c.framed.has('HO2')) return { code: 4 };
        if (inp.ho2Broken) return { code: 3, note: '精神崩壊したまま連れ帰られた場合の専用ENDはないため、END 3を準用しています。' };
        if (inp.ho2Confess && inp.sd) return { code: 1 };
        if (inp.ho2Choice === 'C') return { code: 7 };
        if (inp.ho2Confess) return { code: 1, note: 'SDカード未提出のため厳密には条件外です。自白した結末としてEND 1を準用しています。' };
        return { code: 3 };
    }

    // ---------- HO3 ----------
    function judgeHo3(c) {
        const { s } = c;
        if (s[3] === 'killed') return { code: 4 };
        if (c.isDead(3)) return { code: 5 };
        if (s[3] === 'escaped') return { code: 0 };
        if (s[3] === 'surrender') return { code: 3 };
        if (c.ho3Arrested) return { code: null, note: '正体を暴かれて逮捕・拘束された場合の個別ENDは本編に定義されていません。KP裁量で描写してください。' };
        if (c.framingSuccess && c.ho2CagedBy === 'HO3') return { code: 2 };
        if (c.framingSuccess) return { code: 1 };
        return { code: 1, note: '罪の擦り付けは成立していませんが、正体を暴かれないまま生還したためEND 1を準用しています。' };
    }

    // ---------- HO4 ----------
    function judgeHo4(c) {
        const { s, inp } = c;
        if (c.isDead(4)) return { code: 8 };
        if (s[4] === 'escaped') return { code: 0 };
        if (c.ho1Caged && c.ho2CagedBy === 'HO4') return { code: 7 };
        if (c.ho2CagedBy === 'HO4') return { code: 6 };
        if (c.ho1Caged) return { code: 7, note: 'HO1のみを監禁した場合の専用ENDはないため、END 7を準用しています（HO2に関する一文は省いて読み上げてください）。' };
        if (!inp.sd) return c.framed.has('HO4') ? { code: 5 } : { code: 4 };
        if ([1, 2, 3].every(c.isDead)) return { code: 3 };
        const ho1Insane = inp.ho1Broken && c.isPresent(1);
        const ho2Kept = c.isPresent(2) && !c.framed.has('HO2') && !c.ho2Volunteered && c.ho2CagedBy !== 'HO3'
            && !inp.ho2Confess && (inp.ho2Broken || inp.ho2Choice === 'A');
        const ho3Caught = c.ho3Arrested || s[3] === 'surrender';
        if (ho1Insane && ho2Kept) return { code: ho3Caught ? 1 : 2 };
        return { code: null, note: '父の失脚には成功しましたが、END 1〜3の条件（HO1の発狂・HO2を道具として保持 など）を満たしていません。本編に該当する個別ENDがないため、KP裁量で描写してください。' };
    }

    // =========================================================
    // 表示
    // =========================================================
    function endLabel(overall, n, r) {
        if (r.code === null) return `END ${overall}（個別END該当なし）`;
        const end = ENDING_DATA.individual[n].ends[r.code];
        const lost = end && end.lost ? '・ロスト' : '';
        return `END ${overall}-${r.code}${lost}`;
    }

    function render() {
        const inp = readInput();
        const names = getNames();
        updateAvailability(inp);

        const res = evaluate(inp);
        const ov = ENDING_DATA.overall[res.overall];

        const box = $('resultBox');
        box.className = 'result-area end-' + res.overall;
        $('resultName').textContent = `【END ${res.overall}：${ov.title}】へ分岐`;

        let html = '<ul class="report-list">';
        HOS.forEach((n) => {
            html += `<li><span class="report-ho">${escapeHtml(names[n])}</span>${escapeHtml(endLabel(res.overall, n, res.ind[n]))}</li>`;
        });
        html += '</ul>';
        if (res.notes.length) {
            html += '<ul class="note-list">' + res.notes.map((t) => `<li>${escapeHtml(t)}</li>`).join('') + '</ul>';
        }
        $('resultDesc').innerHTML = html;

        return res;
    }

    // 入力欄の有効/無効を切り替える
    function setOff(el, off) {
        if (!el) return;
        el.classList.toggle('is-off', off);
        el.querySelectorAll('input').forEach((i) => { i.disabled = off; });
    }

    function updateAvailability(inp) {
        const defeated = inp.battle === 'defeat';
        const st = inp.status;
        const present = (n) => st[n] === 'alive' || st[n] === 'surrender';

        // 精神崩壊チェック
        setOff(document.querySelector('[data-req="ho1-alive"]'), !(st[1] === 'alive') || inp.battle !== 'defeat');
        setOff(document.querySelector('[data-req="ho2-alive"]'), !(st[2] === 'alive') || inp.battle !== 'defeat');

        // 3. 七瀬への報告
        setOff($('sec_report'), !defeated);

        // 4. HO2の決断
        setOff($('sec_ho2'), !(defeated && st[2] === 'alive' && !inp.ho2Broken));

        // 5. 処遇
        let culprit = inp.culprit;
        if (defeated && st[2] === 'alive' && !inp.ho2Broken && inp.ho2Volunteer) culprit = 'HO2';
        if (st[3] === 'surrender') culprit = 'HO3';
        const fate = activeFates(inp, st, culprit);
        const on41 = fate.ho4OnHo1 !== null;
        const on42 = fate.ho4OnHo2 !== null;
        const on32 = fate.ho3OnHo2 !== null;
        const onPick = on42 && on32 && inp.ho4OnHo2 === 'C' && inp.ho3OnHo2 === 'C';
        setOff($('blk_ho4_on_ho1'), !on41);
        setOff($('blk_ho4_on_ho2'), !on42);
        setOff($('blk_ho3_on_ho2'), !on32);
        setOff($('blk_ho2_pick'), !onPick);
        $('sec_fate').classList.toggle('is-off', !(on41 || on42 || on32));

        // 6. 単独生存
        const solo = defeated && st[3] === 'alive' && [1, 2, 4].every((n) => st[n] === 'lost' || st[n] === 'killed');
        setOff($('sec_solo'), !solo);
    }

    // ---------- 物語の組み立て ----------
    function buildStory() {
        const res = render();
        const names = getNames();
        const ov = ENDING_DATA.overall[res.overall];
        const inp = readInput();
        const parts = [];

        const text = (t) => { if (t) parts.push(`<div class="story-block">${fill(t, names)}</div>`); };
        const head = () => {
            parts.push(`<div class="story-head">END ${res.overall}：${escapeHtml(ov.title)}</div>`);
            parts.push(`<div class="kp-note">達成条件：${fill(ov.cond, names)}</div>`);
        };

        const indBlock = (n) => {
            const r = res.ind[n];
            const data = ENDING_DATA.individual[n];
            const label = `${escapeHtml(names[n])}（HO${n}：${data.label}）`;
            if (r.code === null) {
                parts.push(`<div class="ind-block"><div class="ind-head">${label} ― 個別END該当なし</div><div class="kp-note">${escapeHtml(r.note)}</div></div>`);
                return;
            }
            const end = data.ends[r.code];
            let inner = `<div class="ind-head">${label} ― 【END ${r.code}】</div>`;
            inner += `<div class="kp-note">条件：${fill(end.cond, names)}</div>`;
            if (r.note) inner += `<div class="kp-note">※${escapeHtml(r.note)}</div>`;
            if (end.text) inner += `<div class="ind-text">${fill(end.text, names)}</div>`;
            else inner += '<div class="kp-note">個別描写なし</div>';
            parts.push(`<div class="ind-block">${inner}</div>`);
        };

        const inds = (filter) => {
            const list = HOS.filter(filter);
            if (!list.length) return;
            parts.push('<div class="ind-wrap"><div class="kp-note">▼ ここから個別エンディング</div>');
            list.forEach(indBlock);
            parts.push('<div class="kp-note">▲ ここまで個別エンディング</div></div>');
        };

        head();
        switch (res.overall) {
            case 'A':
            case 'E':
                text(ov.before);
                inds(() => true);
                text(ov.after);
                break;
            case 'B':
                text(ov.before);
                if (!inp.sd) text(ov.sdDrop);
                text(ov.main);
                inds((n) => n === 3);
                text(ov.after);
                break;
            case 'C':
                text(ov.before);
                inds((n) => res.status[n] === 'escaped');
                text(ov.after);
                break;
            case 'D':
                text(ov.before);
                inds(() => true);
                text(ov.after);
                break;
        }

        // 通過報告用の表記（1人1行）
        const report = buildReport(res, names);
        parts.push(
            '<div class="report-box">' +
                '<div class="report-box-head"><span>通過報告用</span>' +
                '<button type="button" class="copy-btn" id="copyReportBtn">コピー</button></div>' +
                `<div class="report-text" id="reportText">${escapeHtml(report)}</div>` +
            '</div>'
        );

        $('storyOutput').innerHTML = parts.join('');
        $('copyReportBtn').addEventListener('click', () => copyText(report, $('copyReportBtn')));
        const area = $('storyArea');
        area.style.display = 'block';
        area.scrollIntoView({ behavior: 'smooth' });
    }

    // ---------- 通過報告 ----------
    // Q&Aの方針どおり、ENDタイトルは伏せ「生還／ロスト／行方不明」のみ添える
    function reportStatus(n, r) {
        if (r.code === null) return '生還';
        const end = ENDING_DATA.individual[n].ends[r.code];
        if (end && end.lost) return 'ロスト';
        const missing = (n === 1 && r.code === 5) || (n === 2 && (r.code === 5 || r.code === 6));
        return missing ? '行方不明' : '生還';
    }

    function buildReport(res, names) {
        const lines = HOS.map((n) => {
            const r = res.ind[n];
            const code = r.code === null ? `【END ${res.overall}】` : `【END ${res.overall}-${r.code}】`;
            const who = names[n] === `HO${n}` ? `HO${n}` : `HO${n} ${names[n]}`;
            return `${who}：${code} ${reportStatus(n, r)}`;
        });
        return lines.join('\n');
    }

    function copyText(text, btn) {
        const done = () => {
            const prev = btn.textContent;
            btn.textContent = 'コピーしました';
            btn.disabled = true;
            setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 1500);
        };
        const fallback = () => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { /* noop */ }
            document.body.removeChild(ta);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, fallback);
        } else {
            fallback();
        }
    }

    // ---------- 見出しなどの {HO*} を名前に差し替え ----------
    const templated = [];
    function collectTemplates() {
        const walker = document.createTreeWalker(document.querySelector('.container'), NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (/\{HO[1-4]\}/.test(node.nodeValue)) templated.push({ node, tpl: node.nodeValue });
        }
    }
    function refreshTemplates() {
        const names = getNames();
        templated.forEach((t) => { t.node.nodeValue = fillPlain(t.tpl, names); });
    }

    // ---------- 名前の保存（このブラウザ内のみ） ----------
    const STORE_KEY = 'hakoniwa-ending-names';
    function loadNames() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            HOS.forEach((n) => { if (saved[n]) $(`name_ho${n}`).value = saved[n]; });
        } catch (e) { /* 保存できない環境では何もしない */ }
    }
    function saveNames() {
        try {
            const v = {};
            HOS.forEach((n) => { v[n] = $(`name_ho${n}`).value; });
            localStorage.setItem(STORE_KEY, JSON.stringify(v));
        } catch (e) { /* noop */ }
    }

    // ---------- 起動 ----------
    function init() {
        collectTemplates();
        loadNames();
        refreshTemplates();

        document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((el) => {
            el.addEventListener('change', render);
        });
        HOS.forEach((n) => {
            $(`name_ho${n}`).addEventListener('input', () => {
                saveNames();
                refreshTemplates();
                render();
            });
        });
        $('storyBtn').addEventListener('click', buildStory);
        render();
    }

    // テスト用に判定関数を公開
    window.HakoniwaEnding = { evaluate };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
