FoEproxy.addHandler('StartupService', 'all', (data, postData) => {

    if (data.requestMethod === 'getData') {
        battleadvice.era = data.responseData.user_data.era;
    }
    return;
});

FoEproxy.addHandler('BattlefieldService', 'all', (data, postData) => {

    if (data.requestMethod === 'getArmyPreview') {
        battleadvice.army = data.responseData[0];
        battleadvice.advice = [];
    }
    json = "";
    if (true) {
        json = JSON.stringify(data.responseData);

        fetch('https://foecollector.herokuapp.com/dbwrite/', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'requestclass': data.requestClass,
                'requestmethod': data.requestMethod,
                'responsedata': json
            })
        });

       if ($('#BattleAdvice').length !== 0) {
            $('#BattleAdviceBody').html("updating...");
            battleadvice.RequestAndUpdateAdvice();
       }
    }
    return;
});

FoEproxy.addHandler('GuildExpeditionService', 'all', (data, postData) => {

    if (data.requestMethod === 'getEncounter') {
        battleadvice.army = data.responseData['armyWaves'][0];
        battleadvice.advice = [];
    }

    json = "";
    if (true) {
        json = JSON.stringify(data.responseData);

        fetch('https://foecollector.herokuapp.com/dbwrite/', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'requestclass': data.requestClass,
                'requestmethod': data.requestMethod,
                'responsedata': json
            })
        });

       if ($('#BattleAdvice').length !== 0) {
            $('#BattleAdviceBody').html("updating...");
            battleadvice.RequestAndUpdateAdvice();
       }
    }
    return;
});

FoEproxy.addHandler('PVPArenaService', 'all', (data, postData) => {

    json = "";
    if (true) {
        json = JSON.stringify(data.responseData);

        fetch('https://foecollector.herokuapp.com/dbwrite/', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'requestclass': data.requestClass,
                'requestmethod': data.requestMethod,
                'responsedata': json
            })
        });
    }
    return;
});

let battleadvice = {

    era: "",
    army: null,
    advice: [],

    /**
     * Shows a box
     *
     * @constructor
     */
    ShowDialog: () => {
		if ($('#BattleAdvice').length === 0) {
            HTML.AddCssFile('battleadvice');
            HTML.Box({
                id: 'BattleAdvice',
                title: i18n('Boxes.BattleAdvice.Title'),
                auto_close: true,
                dragdrop: true,
                minimize: true,
                resize: true,
            });
        }

        let htmltext = "undefined";
        if (battleadvice.army != null) {
            if (battleadvice.advice.length == 0) {
                htmltext = "<p>Abfrage an Advice Server gestartet, bitte warten</p>";
                battleadvice.RequestAndUpdateAdvice();
            } else {
                battleadvice.UpdateAdvice(battleadvice.advice);
            }
        } else
            htmltext = "Erst 'Armee-Organisation' aufrufen";

        $('#BattleAdviceBody').html(htmltext);
    },

    close: () => {
        battleadvice.saveSettings();
    },

    CloseBox: () => {
        HTML.CloseOpenBox('BattleAdvice');
        battleadvice.close();
    },

    RequestAndUpdateAdvice: () => {
            response = fetch('https://foebattlestats.herokuapp.com/advice/', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'army': JSON.stringify(battleadvice.army),
                    'era': battleadvice.era
                })
            }).then(response => { return response.text(); }).then(data => {
                battleadvice.advice = data;
                battleadvice.UpdateAdvice(data);
            });
    },

    UpdateAdvice: (advice) => {
                t = [];
                data = JSON.parse(advice);
                if (data.length > 0) {
                    t.push('<table class="foe-table">');
                    t.push('<th colspan="8">');
                    t.push('Verteidigende Einheiten des Gegners: ');
                    t.push(data[0]['defender_units']);
                    if (data[0]['nextbattle_wave_id']) {
                        t.push(' ( + 2. Welle)');
                    }
                    t.push('</th></tr>');
                    t.push('<tr><th colspan="3"></th><th colspan="2">1. Welle</th><th colspan="3">2. Welle</th></tr>');
                    t.push('<tr><th>Vert. A/V</th><th>Angreifer Einheiten</th><th>Angr. A/V</th><th>Verlust</th><th>Erfolg</th><th>Verlust</th><th colspan="2">Erfolg</th></tr>');
                    data.forEach((battle, i) => {
                        t.push('<tr><td>');
                        t.push(battle['defender_attack_boost']);
                        t.push('/')
                        t.push(battle['defender_defend_boost']);
                        t.push('</td><td>');
                        t.push(battle['attacker_units']);
                        t.push('</td><td>');
                        t.push(battle['attacker_attack_boost']);
                        t.push('/')
                        t.push(battle['attacker_defend_boost']);
                        t.push('</td><td>');
                        t.push(battle['attacker_losses']);
                        t.push('</td><td>');
                        t.push(battle['attacker_success']);
                        if (battle['nextbattle_wave_id']) {
                            t.push('</td><td>');
                            t.push(battle['nextbattle_attacker_losses']);
                            t.push('</td><td>');
                            t.push(battle['nextbattle_attacker_success']);
                        } else {
                            t.push('</td><td>');
                            t.push('</td><td>');
                        }
                        t.push('</td><td>');
                        t.push(battle['comment']);
                        t.push('</td></tr>');
                    });
                    t.push('</table>');
                } else
                    t.push("no battles found");
                htmltext = '<div class="flex">';
                htmltext += t.join('');
                htmltext += '</div>';
                $('#BattleAdviceBody').html(htmltext);
    },

    loadSettings: ()=> {
		tempSettings = JSON.parse(localStorage.getItem('battleadviceSettings') || '{}');
        battleadvice.Settings = battleadvice.update(battleadvice.Settings,tempSettings);
    },

    saveSettings: ()=> {
        localStorage.setItem('battleadviceSettings', JSON.stringify(battleadvice.Settings));
    },

    update (obj/*, …*/) {
        for (var i=1; i<arguments.length; i++) {
            for (var prop in arguments[i]) {
                var val = arguments[i][prop];
                if (typeof val == "object") // this also applies to arrays or null!
                    battleadvice.update(obj[prop], val);
                else
                    obj[prop] = val;
            }
        }
        return obj;
    }

};


