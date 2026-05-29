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

    resultBox.className = 'result-area';

    // ====================================================
    // 1. 【END C：泥濘に沈む真実】
    // ====================================================
    // 神話生物の未撃破、またはSDカード不所持、または特捜班が全員死亡の場合
    if (!statusMyth || !statusEvidence || (!ho1Alive && !ho2Alive && !ho3Alive && !ho4Alive)) {
        resultBox.classList.add('end-C');
        resultName.innerText = '【END C：泥濘に沈む真実】へ分岐';
        currentEndingCode = 'C';
        return;
    }

    // ====================================================
    // 2. 【END H：蜜に群がる羽虫たち】
    // ====================================================
    // 特捜班が全員生存（または主要PC生存）で、全体結末として「事件の隠蔽（蜜への屈服）」を選択した場合
    if (caseEnd === 'bury_end' && ho1Status === 'alive_justice') {
        resultBox.classList.add('end-H');
        resultName.innerText = '【END H：蜜に群がる羽虫たち】へ分岐';
        currentEndingCode = 'H';
        return;
    }

    // ====================================================
    // 3. 【END B：完全なるシンメトリー】
    // ====================================================
    // HO3が一人勝ち（逃亡）した、あるいは他PCが全員死亡してHO3だけが生存している場合
    if (ho3Status === 'win' || (!ho1Alive && !ho2Alive && !ho4Alive && ho3Alive)) {
        resultBox.classList.add('end-B');
        resultName.innerText = '【END B：完璧なアシンメトリー】へ分岐';
        currentEndingCode = 'B';
        return;
    }

    // ====================================================
    // 4. 【END G：完璧なる駒の叛逆】
    // ====================================================
    // HO1、HO2、HO3が全員ロストし、HO4一人のみが孤高の生還を果たした場合
    if (!ho1Alive && !ho2Alive && !ho3Alive && ho4Alive) {
        resultBox.classList.add('end-G');
        resultName.innerText = '【END G：完璧なる駒の叛逆】へ分岐';
        currentEndingCode = 'G';
        return;
    }

    // ====================================================
    // 5. 【END E：楽園の檻】
    // ====================================================
    // HO1が「執着と狂気（HO3の守護・監禁）」を選択し、かつHO3が生存（身柄拘束/監禁）している場合
    if (ho1Status === 'alive_obsess' && ho3Status === 'arrest') {
        resultBox.classList.add('end-E');
        resultName.innerText = '【END E：楽園の檻】へ分岐';
        currentEndingCode = 'E';
        return;
    }

    // ====================================================
    // 6. 【END F：身代わりの洗礼】
    // ====================================================
    // 全体の結末として「冤罪の幕引き」が選ばれた、またはHO2に罪が擦り付けられた場合
    if (caseEnd === 'scapegoat_end' || ho2Status === 'scapegoat') {
        resultBox.classList.add('end-F');
        resultName.innerText = '【END F：身代わりの洗礼】へ分岐';
        currentEndingCode = 'F';
        return;
    }

    // ====================================================
    // 7. 【END D：復讐の連鎖】
    // ====================================================
    // HO1のステータスが明確に「復讐の完遂（殺害意図をもって引き金を引いた）」である場合のみDへ
    if (ho1Status === 'alive_revenge') {
        resultBox.classList.add('end-D');
        resultName.innerText = '【END D：復讐の連鎖】へ分岐';
        currentEndingCode = 'D';
        return;
    }

    // ====================================================
    // 8. 【END A：箱庭の崩壊と、光差す夜明け】
    // ====================================================
    // 条件クリア：アブホース撃破・SDあり・HO3の逮捕・HO1が理性を保ち（正義の執行）・HO2自白・HO4通常生還
    if (caseEnd === 'ho3_arrest' && ho1Status === 'alive_justice' && ho2Status === 'confess' && ho4Choice === 'return') {
        resultBox.classList.add('end-A');
        resultName.innerText = '【END A：箱庭の崩壊と、光差す夜明け】へ分岐';
        currentEndingCode = 'A';
        return;
    }

    // 激闘によるHO3の死亡ロストなど、通常のハッピー条件から外れた戦闘終了パターンは
    // すべて大元であるグッドエンド【END A】へ着地（HO3死亡時のアナウンス等はGMがアドリブで対応可能）
    resultBox.classList.add('end-A');
    resultName.innerText = '【END A：箱庭の崩壊と、光差す夜明け】へ分岐';
    currentEndingCode = 'A';
}

function generateStoryEnding() {
    const p1 = document.getElementById('name_ho1').value || 'HO1';
    const p2 = document.getElementById('name_ho2').value || 'HO2';
    const p3 = document.getElementById('name_ho3').value || 'HO3';
    const p4 = document.getElementById('name_ho4').value || 'HO4';

    const storyArea = document.getElementById('storyArea');
    const storyOutput = document.getElementById('storyOutput');

    const filePath = `./endings/end_${currentEndingCode}.html`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
            return response.text();
        })
        .then(htmlText => {
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
                <div style="font-weight: bold; font-size: 18px; color: #e74c3c; margin-bottom: 15px;">確定結末コード: 【END ${currentEndingCode}】</div>
                <p>endingsフォルダ内の [end_${currentEndingCode}.html] を出力します。</p>`;
            storyArea.style.display = 'block';
            storyArea.scrollIntoView({ behavior: 'smooth' });
        });
}

document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', evaluateEnding);
});

evaluateEnding();
