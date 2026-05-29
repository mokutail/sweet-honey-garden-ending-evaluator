// グローバル変数として現在の確定エンドコードを保持
let currentEndingCode = 'A';

function evaluateEnding() {
    // HTMLの全選択肢の値を正確に取得
    const caseEnd = document.querySelector('input[name="case_end"]:checked').value;
    const ho1Status = document.querySelector('input[name="ho1_status"]:checked').value;
    const ho2Status = document.querySelector('input[name="ho2_status"]:checked').value;
    const ho3Status = document.querySelector('input[name="ho3_status"]:checked').value;
    const ho4Choice = document.querySelector('input[name="ho4_choice"]:checked').value;
    
    const statusMyth = document.getElementById('status_myth').checked;
    const statusEvidence = document.getElementById('status_evidence').checked;
    
    // 生存フラグの判定
    const ho1Alive = (ho1Status !== 'dead');
    const ho2Alive = (ho2Status !== 'dead');
    const ho3Alive = (ho3Status !== 'dead');
    const ho4Alive = (ho4Choice !== 'dead');

    const resultBox = document.getElementById('resultBox');
    const resultName = document.getElementById('resultName');

    // クラスのリセット
    resultBox.className = 'result-area';

    // ====================================================
    // 1. 最優先システムバッド：【END C：泥濘に沈む真実】
    // ====================================================
    // アブホース未撃破、またはSDカード紛失、または特捜班が全員死亡の場合
    if (!statusMyth || !statusEvidence || (!ho1Alive && !ho2Alive && !ho3Alive && !ho4Alive)) {
        resultBox.classList.add('end-C');
        resultName.innerText = '【END C：泥濘に沈む真実（箱庭の維持）】へ分岐';
        currentEndingCode = 'C';
        return;
    }

    // ====================================================
    // 2. カルト化・屈服エンド：【END H：蜜に群がる羽虫たち】
    // ====================================================
    // このエンドの発生条件は、全員が生存偏りなどの個別エンドに引っかからず、九条の蜜に屈した場合
    // 後述のハッピーやビターの条件を満たさない、あるいは全体として隠蔽を選んだ場合等に連動
    if (caseEnd === 'bury_end' && ho4Choice === 'return' && ho1Status === 'alive_justice') {
        // HO1が監禁ではなく純粋な事件隠蔽（諦め）で、HO4も通常生還（実父への服従）の場合、魂の腐敗ルートへ
        resultBox.classList.add('end-H');
        resultName.innerText = '【END H：蜜に群がる羽虫たち】へ分岐';
        currentEndingCode = 'H';
        return;
    }

    // ====================================================
    // 3. HO3完全勝利・芸術完成：【END B：完全なるシンメトリー】
    // ====================================================
    // HO3が一人勝ちしている、または他PCが全滅してHO3が生存している場合
    if (ho3Status === 'win' || (!ho1Alive && !ho2Alive && !ho4Alive && ho3Alive)) {
        resultBox.classList.add('end-B');
        resultName.innerText = '【END B：完全なるシンメトリー】へ分岐';
        currentEndingCode = 'B';
        return;
    }

    // ====================================================
    // 4. 狂気・共犯・耽美エンド：【END J：共犯者の輪舞曲】
    // ====================================================
    // 全体結末が隠蔽、かつHO1が「執着と狂気（HO3の守護・加担）」を選んでおり、HO3が一人勝ち・ロストしていない場合
    if (caseEnd === 'bury_end' && ho1Status === 'alive_obsess' && ho3Status === 'arrest') {
        // ※PLの解釈やRPによって、手を取り合う最悪の共犯者となる場合はJへ
        resultBox.classList.add('end-J');
        resultName.innerText = '【END J：共犯者の輪舞曲（ロンド）】へ分岐';
        currentEndingCode = 'J';
        return;
    }

    // ====================================================
    // 5. 狂気・監禁・飼育エンド：【END E：楽園の檻、あるいは飼育】
    // ====================================================
    // 全員生存ベースで、HO1が「執着と狂気」を選択し、HO3が檻（身柄拘束/監禁）にいる場合
    if (ho1Status === 'alive_obsess' && ho3Status === 'arrest' && ho2Alive && ho4Alive) {
        resultBox.classList.add('end-E');
        resultName.innerText = '【END E：楽園の檻、あるいは飼育】へ分岐';
        currentEndingCode = 'E';
        return;
    }

    // ====================================================
    // 6. 生存偏りによる少人数ビターエンド：【END L】 / 【END M】
    // ====================================================
    // HO2とHO4が死亡（ロスト）し、地下にHO1とHO3だけが残された場合
    if (ho1Alive && !ho2Alive && !ho4Alive) {
        // HO1が執着（あるいは事件隠蔽）を選び、HO3が生きているなら【L：檻の中の二人】
        if ((ho1Status === 'alive_obsess' || caseEnd === 'bury_end') && ho3Alive) {
            resultBox.classList.add('end-L');
            resultName.innerText = '【END L：檻の中の二人】へ分岐';
            currentEndingCode = 'L';
            return;
        }
        // HO1が復讐完遂を選んだ、またはHO3が死亡しているなら【M：夜霧に消える弾痕】
        if (ho1Status === 'alive_revenge' || caseEnd === 'ho3_kill' || !ho3Alive) {
            resultBox.classList.add('end-M');
            resultName.innerText = '【END M：夜霧に消える弾痕】へ分岐';
            currentEndingCode = 'M';
            return;
        }
    }

    // ====================================================
    // 7. HO4（キング）孤高の特攻・告発：【END G：完璧なる駒の叛逆】
    // ====================================================
    // HO1、HO2、HO3が全員ロストし、HO4一人のみが生存して生還した場合
    if (!ho1Alive && !ho2Alive && !ho3Alive && ho4Alive) {
        resultBox.classList.add('end-G');
        resultName.innerText = '【END G：完璧なる駒の叛逆】へ分岐';
        currentEndingCode = 'G';
        return;
    }

    // ====================================================
    // 8. 冤罪の告発・トカゲの尻尾切り：【END F：身代わりの洗礼】
    // ====================================================
    // 全体結末が「冤罪の幕引き（他PCの身代わり）」になっている場合
    if (caseEnd === 'scapegoat_end' || ho2Status === 'scapegoat') {
        resultBox.classList.add('end-F');
        resultName.innerText = '【END F：身代わりの洗礼】へ分岐';
        currentEndingCode = 'F';
        return;
    }

    // ====================================================
    // 9. 真相未到達・不気味な日常の継続：【END N】 / 【END O】
    // ====================================================
    // 誰も真相を見抜けず（あるいはNPCをホシにして）解決とした場合
    if (caseEnd === 'npc_end') {
        // HO2が隠蔽の継続（過去の罪がバレていない）を選んでいる場合、誰も気づかない【O：羊たちの沈黙】
        if (ho2Status === 'blind') {
            resultBox.classList.add('end-O');
            resultName.innerText = '【END O：羊たちの沈黙】へ分岐';
            currentEndingCode = 'O';
            return;
        } else {
            // そうでなければ、真犯人を隣に据えたままの【N：蛇を育む箱庭】
            resultBox.classList.add('end-N');
            resultName.innerText = '【END N：蛇を育む箱庭】へ分岐';
            currentEndingCode = 'N';
            return;
        }
    }

    // ====================================================
    // 10. 復讐の完遂・殺人鬼への転落（全員生存ベース）：【END D】
    // ====================================================
    // 全体の結末が「HO3の抹殺」、あるいはHO1が「復讐の完遂」を選んだ、またはHO3が死亡した場合
    if (caseEnd === 'ho3_kill' || ho1Status === 'alive_revenge' || !ho3Alive) {
        resultBox.classList.add('end-D');
        resultName.innerText = '【END D：復讐の連鎖と、残された首輪】へ分岐';
        currentEndingCode = 'D';
        return;
    }

    // ====================================================
    // 11. メイン・グッドエンド：【END A：箱庭の崩壊と、光差す夜明け】
    // ====================================================
    // 全条件達成：アブホース撃破・SDあり・HO3逮捕・HO1正義・HO2自白・HO4通常生還（反逆貫徹）
    if (caseEnd === 'ho3_arrest' && ho1Status === 'alive_justice' && ho2Status === 'confess' && ho4Choice === 'return') {
        resultBox.classList.add('end-A');
        resultName.innerText = '【END A：箱庭の崩壊と、光差す夜明け】へ分岐';
        currentEndingCode = 'A';
        return;
    }

    // どの条件にも完全に当てはまらなかった場合の包括的な個別エピローグ用分岐
    resultName.innerText = '【特捜班の個別エピローグへ（条件組み合わせ）】';
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
            主軸の事件は終了しました。生き残ったメンバー（HO1: ${p1} / HO2: ${p2} / HO3: ${p3} / HO4: ${p4}）それぞれの最終ステータスを組み合わせて、個別の物語を描写してください。`;
        storyArea.style.display = 'block';
        storyArea.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // 確定したアルファベットのファイルをフェッチして読み込む
    const filePath = `./endings/end_${currentEndingCode}.html`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
            return response.text();
        })
        .then(htmlText => {
            // テキスト内の[HO1]〜[HO4]を、入力されたPC名に確実に一括置換
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
                <p>外部ファイルの読み込みに失敗しました。endingsフォルダ内の [end_${currentEndingCode}.html] の中身を出力してください。</p>`;
            storyArea.style.display = 'block';
            storyArea.scrollIntoView({ behavior: 'smooth' });
        });
}

// すべてのラジオボタンとチェックボックスに入力変更時の自動再計算イベントを付与
document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', evaluateEnding);
});

// 初回読み込み時に計算
evaluateEnding();
