FoEproxy.addHandler('StartupService', 'all', (data, postData) => {

    if (data.requestMethod === 'getData') {
        battleadvice.era = data.responseData.user_data.era;
    }
    return;
});

FoEproxy.addHandler('BattlefieldService', 'all', (data, postData) => {

    if (data.requestMethod === 'getArmyPreview') {
        battleadvice.army = data.responseData[0];
        battleadvice.data = [];
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
    }
    return;
});

FoEproxy.addHandler('GuildExpeditionService', 'all', (data, postData) => {

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
    army: [],
    data: [],

    /**
     * Shows a box
     *
     * @constructor
     */
    ShowDialog: () => {
        let htmltext = "<p>noch keine Daten über gegnerische Einheiten vorhanden, bitte warten.</p>";

        if (battleadvice.army.length != 0 && battleadvice.data.length == 0) {
            response = fetch('https://foebattlestats.herokuapp.com/advice/', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'army': JSON.stringify(battleadvice.army),
                    'era': battleadvice.era
                })
            }).then(response => { return response.text(); }).then(data => { battleadvice.data = data; });
        }

        if (battleadvice.data.length > 0) {
            data1 = JSON.parse(battleadvice.data);
            t = [];
            t.push('<table class="foe-table">');
            t.push('<tr><th colspan="2">Verteidiger</th><th colspan="4">Angreifer</th></tr>');
            t.push('<tr><th>Einheiten</th><th>A/V</th><th>Einheiten</th><th>A/V</th><th>Verlust</th><th>Erfolg</th></tr>');

            data1.forEach((battle, i) => {
                t.push('<tr><td>');
                t.push(battle['defender_units']);
                t.push('</td><td>');
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
                t.push('</td></tr>');
            });
            t.push('</table>');
            htmltext = '<div class="flex">';
            htmltext += t.join('');
            htmltext += '</div>';
        }

        if ($('#battleAdviceDialog').length === 0) {
            HTML.AddCssFile('battleadvice');
    
            HTML.Box({
                id: 'battleAdviceDialog',
                title: i18n('Boxes.BattleAdvice.Title'),
                auto_close: true,
                dragdrop: true,
                minimize: true,
                resize: true,                
            });

            $('#battleAdviceDialogclose').on('click', function() {
                battleadvice.close();
            });
        }
    
        $('#battleAdviceDialogBody').html(htmltext);
    },

    
    close: () => {
        battleadvice.saveSettings();
    },

    CloseBox: () => {
        HTML.CloseOpenBox('battleAdviceDialog');
        battleadvice.close();
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


