// グローバル変数として現在の確定エンドコードを保持
let currentEndingCode = 'A';

function evaluateEnding() {
    const caseEnd = document.querySelector('input[name="case_end"]:checked').value;
    const ho1Status = document.querySelector('input[name="ho1_status"]:checked').value;
    const ho2Status = document.querySelector('input[name="ho2_status"]:checked').value;
    const ho3Status = document.querySelector('input[name="ho3_status"]:checked').value;
    const ho4Choice = document.querySelector('input[name="ho4_choice"]:checked').value;
    
    const statusMyth = document.getElementById('status_myth').checked;
    const statusEvidence = document.getElementById('status_evidence').checked;
    
    const ho1Alive = (ho1Status !== 'dead');
    const ho2Alive = (ho2Status !== 'dead');
    const ho3Alive = (ho3Status !== 'dead');
    const ho4Alive = (ho4Choice !== 'dead');

    const resultBox = document.getElementById('resultBox');
    const resultName = document.getElementById('resultName');

    // CSSクラスのリセット（style.css側の装飾用）
    resultBox.className = 'result-area';

    // ====================================================
    // ① 最優先バッド：【END C】（未撃破、または証拠紛失、または全滅）
    // ====================================================
    if (!statusMyth || !statusEvidence || (!ho1Alive && !ho2Alive && !ho3Alive && !ho4Alive)) {
        resultBox.classList.add('end-C');
        resultName.innerText = '【END C：箱庭に注がれた甘美な蜜】へ分岐';
        currentEndingCode = 'C';
        return;
    }

    // ====================================================
    // ② 優先高：【END B】（HO3の一人勝ち、または逃亡）
    // ====================================================
    if (caseEnd === 'win' || ho3Status === 'win' || (!ho1Alive && !ho2Alive && !ho4Alive && ho3Alive)) {
        resultBox.classList.add('end-B');
        resultName.innerText = '【END B：完璧なアシンメトリー】へ分岐';
        currentEndingCode = 'B';
        return;
    }

    // ====================================================
    // ③ 優先中：【飼育・支配系エンド】（E、または新設のH）
    // ====================================================
    // HO4がHO2を飼育・支配することを選択した場合
    if (ho4Choice === 'tame_ho2' && ho2Alive) {
        resultBox.classList.add('end-H');
        resultName.innerText = '【END H：蜜に群がる羽虫たち（HO2の飼育）】へ分岐';
        currentEndingCode = 'H';
        return;
    }

    // HO1が事件の隠蔽を選択、またはHO3の監禁を選択した場合
    if (caseEnd === 'bury_end' || ho1Status === 'alive_obsess') {
        if (ho3Alive) {
            resultBox.classList.add('end-E');
            resultName.innerText = '【END E：楽園の檻】へ分岐';
            currentEndingCode = 'E';
            return;
        }
    }

    // ====================================================
    // ④ 優先中：【冤罪・身代わりエンド】（END F）
    // ====================================================
    if (caseEnd === 'scapegoat_end' || ho2Status === 'scapegoat') {
        resultBox.classList.add('end-F');
        resultName.innerText = '【END F：身代わりの洗礼】へ分岐';
        currentEndingCode = 'F';
        return;
    }

    // ====================================================
    // ⑤ 優先中：【復讐・私刑エンド】（END D）
    // ====================================================
    if (caseEnd === 'ho3_kill' || ho1Status === 'alive_revenge' || !ho3Alive) {
        resultBox.classList.add('end-D');
        resultName.innerText = '【END D：復讐の連鎖】へ分岐';
        currentEndingCode = 'D';
        return;
    }

    // ====================================================
    // ⑥ 優先低：【HO4孤高の内部告発】（END G）
    // ====================================================
    // HO1とHO2がロストしており、HO4一人が生還して告発する場合
    if (!ho1Alive && !ho2Alive && ho4Alive && ho4Choice === 'return') {
        resultBox.classList.add('end-G');
        resultName.innerText = '【END G：完璧なる駒の叛逆】へ分岐';
        currentEndingCode = 'G';
        return;
    }

    // ====================================================
    // ⑦ 条件達成：【END A】大団円（アブホース撃破、証拠あり、正義執行、全員生還ベース）
    // ====================================================
    if (caseEnd === 'ho3_arrest' && ho4Choice === 'return') {
        resultBox.classList.add('end-A');
        resultName.innerText = '【END A：箱庭の崩壊と、光差す夜明け】へ分岐';
        currentEndingCode = 'A';
        return;
    }

    // 上記のどれにも引っかからなかった場合の包括的なエピローグ処理
    resultName.innerText = '【特捜班の個別エピローグへ】';
    currentEndingCode = 'GENERIC';
}

function generateStoryEnding() {
    const p1 = document.getElementById('name_ho1').value || 'HO1';
    const p2 = document.getElementById('name_ho2').value || 'HO2';
    const p3 = document.getElementById('name_ho3').value || 'HO3';
    const p4 = document.getElementById('name_ho4').value || 'HO4';

    const storyArea = document.getElementById('storyArea');
    const storyOutput = document.getElementById('storyOutput');

    if (currentEndingCode === 'GENERIC') {
        storyOutput.innerHTML = `
            <div style="font-weight: bold; font-size: 18px; color: #7f8c8d; margin-bottom: 15px;">【特捜班の個別エピローグへ】</div>
            主軸の事件は終了しました。生き残ったメンバー（HO1: ${p1} / HO2: ${p2} / HO3: ${p3} / HO4: ${p4}）それぞれの最終行動を組み合わせて、個別の物語を描写してください。`;
        storyArea.style.display = 'block';
        storyArea.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // endingsフォルダ内の各エンドHTMLを読み込む（システム置換用コード）
    const filePath = `./endings/end_${currentEndingCode}.html`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
            return response.text();
        })
        .then(htmlText => {
            // テキスト内の[HO1]〜[HO4]の文字列を、登録されたPC名に一括置換
            let formattedText = htmlText
                .replace(/\[HO1\]/g, p1)
                .replace(/\[HO2\]/g, p2)
                .replace(/\[HO3\]/g, p3)
                .replace(/\[HO4\]/g, p4);

            storyOutput.innerHTML = formattedText;
            storyArea.style.display = 'block';
            storyArea.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error(error);
            storyOutput.innerHTML = `
                <div style="font-weight: bold; font-size: 18px; color: #e74c3c; margin-bottom: 15px;">確定結慢コード: 【END ${currentEndingCode}】</div>
                <p>外部ファイルの読み込みに失敗しました。ローカル環境の場合はサーバーを起動するか、エンドテキスト一覧から直接【END ${currentEndingCode}】を参照してください。</p>`;
            storyArea.style.display = 'block';
            storyArea.scrollIntoView({ behavior: 'smooth' });
        });
}

// 選択肢が変更されたら、リアルタイムで判定を再計算するイベントリスナー
document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', evaluateEnding);
});

// ページ読み込み時に初期計算を実行
evaluateEnding();
