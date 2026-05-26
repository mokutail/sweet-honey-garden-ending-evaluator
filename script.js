// グローバル変数として現在の確定エンドコードを保持
let currentEndingCode = 'A';

function evaluateEnding() {
    const caseTruth = document.querySelector('input[name="case_truth"]:checked').value;
    const ho1Choice = document.querySelector('input[name="ho1_choice"]:checked').value;
    const ho2Choice = document.querySelector('input[name="ho2_choice"]:checked').value;
    const ho3Status = document.querySelector('input[name="ho3_status"]:checked').value;
    const ho4Choice = document.querySelector('input[name="ho4_choice"]:checked').value;
    const bossTruth = document.querySelector('input[name="boss_truth"]:checked').value;
    
    const statusMyth = document.getElementById('status_myth').checked;
    const statusEvidence = document.getElementById('status_evidence').checked;
    
    const ho1Alive = (ho1Choice !== 'dead');
    const ho2Alive = (ho2Choice !== 'dead');
    const ho3Alive = (ho3Status !== 'dead');
    const ho4Alive = (ho4Choice !== 'dead');

    const resultBox = document.getElementById('resultBox');
    const resultName = document.getElementById('resultName');

    resultBox.className = 'result-area';

    // 判定ロジック
    if ((!ho1Alive && !ho2Alive && !ho3Alive && !ho4Alive) || !statusMyth || !statusEvidence || (bossTruth === 'boss_alive' && ho4Choice === 'accomplice')) {
        if (statusMyth && statusEvidence && bossTruth === 'boss_alive' && ho4Alive) {
            resultBox.classList.add('end-H');
            resultName.innerText = '【END H：蜜に群がる羽虫たち】へ分岐可能';
            currentEndingCode = 'H';
            return;
        }
        resultBox.classList.add('end-C');
        resultName.innerText = '【END C：泥濘に沈む真実（箱庭の維持）】へ分岐可能';
        currentEndingCode = 'C';
        return;
    }

    if (ho3Status === 'win' || (!ho1Alive && !ho2Alive && !ho4Alive && ho3Alive)) {
        resultBox.classList.add('end-B');
        resultName.innerText = '【END B：完全なるシンメトリー】へ分岐可能';
        currentEndingCode = 'B';
        return;
    }

    if (caseTruth === 'other_pc_arrest' || caseTruth === 'other_pc_kill' || ho1Choice === 'blind_law' || ho1Choice === 'blind_kill') {
        resultBox.classList.add('end-F');
        resultName.innerText = '【END F：身代わりの洗礼（冤罪の幕引き）】へ分岐可能';
        currentEndingCode = 'F';
        return;
    }

    if (caseTruth === 'npc_arrest') {
        if (ho2Choice === 'blind') {
            resultBox.classList.add('end-H');
            resultName.innerText = '【END O：羊たちの沈黙（完全なる箱庭）】へ分岐可能';
            currentEndingCode = 'O';
            return;
        } else {
            resultBox.classList.add('end-B');
            resultName.innerText = '【END N：蛇を育む箱庭（真犯人隠蔽）】へ分岐可能';
            currentEndingCode = 'N';
            return;
        }
    }

    if (ho1Alive && !ho2Alive && !ho4Alive) {
        if (ho1Choice === 'bury' && ho3Alive) {
            resultBox.classList.add('end-E');
            resultName.innerText = '【END L：檻の中の二人】へ分岐可能';
            currentEndingCode = 'L';
            return;
        }
        if (ho1Choice === 'kill_ho3' || caseTruth === 'ho3_kill' || !ho3Alive) {
            resultBox.classList.add('end-D');
            resultName.innerText = '【END M：夜霧に消える弾痕】へ分岐可能';
            currentEndingCode = 'M';
            return;
        }
    }

    if (!ho1Alive && ho2Alive && !ho3Alive && ho4Alive) {
        resultBox.classList.add('end-G');
        resultName.innerText = '【END K：冷たい正義の弾丸】へ分岐可能';
        currentEndingCode = 'K';
        return;
    }

    if (!ho1Alive && !ho2Alive && !ho3Alive && ho4Alive && ho4Choice === 'rebel') {
        resultBox.classList.add('end-G');
        resultName.innerText = '【END G：完璧なる駒の叛逆】へ分岐可能';
        currentEndingCode = 'G';
        return;
    }

    if (ho1Choice === 'bury' && ho3Alive) {
        resultBox.classList.add('end-E');
        resultName.innerText = '【END E：楽園の檻, あるいは飼育】へ分岐可能';
        currentEndingCode = 'E';
        return;
    }

    if (caseTruth === 'ho3_kill' || ho1Choice === 'kill_ho3' || !ho3Alive) {
        resultBox.classList.add('end-D');
        resultName.innerText = '【END D：復讐の連鎖と、残された首輪】へ分岐可能';
        currentEndingCode = 'D';
        return;
    }

    if (bossTruth === 'boss_arrest' || bossTruth === 'boss_kill' || (caseTruth === 'ho3_arrest' && ho1Choice === 'reason' && ho2Choice === 'confess' && ho4Choice === 'rebel')) {
        resultBox.classList.add('end-A');
        resultName.innerText = '【END A：箱庭の崩壊と、光差す夜明け】へ分岐可能';
        currentEndingCode = 'A';
        return;
    }

    resultName.innerText = '【特捜班の個別エピローグへ】へ分岐可能';
    currentEndingCode = 'GENERIC';
}

// 独立したファイルを確実に読み込む関数
function generateStoryEnding() {
    const p1 = document.getElementById('name_ho1').value || 'HO1';
    const p2 = document.getElementById('name_ho2').value || 'HO2';
    const p3 = document.getElementById('name_ho3').value || 'HO3';
    const p4 = document.getElementById('name_ho4').value || 'HO4';
    const bossTruth = document.querySelector('input[name="boss_truth"]:checked').value;

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

    // 必ずこの「 detail.html と同じ場所の endings フォルダ」を見に行く指定
    const filePath = `./endings/end_${currentEndingCode}.html`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
            return response.text();
        })
        .then(htmlText => {
            let bossActionText = '集められたすべての証隔を白日の下に晒し、実父の帝国を完全に告発するという茨の道を。';
            if (bossTruth === 'boss_kill') {
                bossActionText = '自らの手で実父の胸にケジメの弾丸を撃ち込むという、あまりにも重すぎる決断を。';
            }

            // プレイヤー名の置換
            let formattedText = htmlText
                .replace(/{HO1}/g, p1)
                .replace(/{HO2}/g, p2)
                .replace(/{HO3}/g, p3)
                .replace(/{HO4}/g, p4)
                .replace(/{HO4_ACTION}/g, bossActionText);

            storyOutput.innerHTML = formattedText;
            storyArea.style.display = 'block';
            storyArea.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            // ここで止まってしまうのは、通信自体がブラウザのセキュリティに拒否されている証拠です
            console.error(error);
            storyOutput.innerHTML = `
                <div style="font-weight: bold; font-size: 18px; color: #e74c3c; margin-bottom: 15px;">確定結慢コード: 【END ${currentEndingCode}】</div>
                <p style="color:#e74c3c;">ブラウザが外部ファイルの読み込みを拒否しました。以下の【ステップ2】の起動方法を試してください。</p>`;
            storyArea.style.display = 'block';
            storyArea.scrollIntoView({ behavior: 'smooth' });
        });
}

document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', evaluateEnding);
});

evaluateEnding();