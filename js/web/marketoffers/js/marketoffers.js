/*
 * **************************************************************************************
 * Copyright (C) 2021 FoE-Helper team - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the AGPL license.
 *
 * See file LICENSE.md or go to
 * https://github.com/mainIine/foe-helfer-extension/blob/master/LICENSE.md
 * for full license details.
 *
 * **************************************************************************************
 */

// Market
FoEproxy.addHandler('TradeService', 'getTradeOffers', (data, postData) => {
    let requestMethod = postData[0]['requestMethod'];

    if (requestMethod === 'getTradeOffers' || requestMethod === 'acceptOfferById') {
        Market.Trades = data.responseData;

        if ($('#marketoffers-Btn').hasClass('hud-btn-red')) {
            $('#marketoffers-Btn').removeClass('hud-btn-red');
            $('#marketoffers-Btn-closed').remove();
        }
    }
});


/**
 * Market function
 *
 */
let MarketOffers = {
    OffersSums: [],
    NeedSums: [],

    CurrentEventsTab: 'accepted',

    /**
     * Create a div-box for the DOM + Eventlistener
     */
    Show: (event = true) => {
        if ($('#MarketOffers').length === 0) {
            HTML.Box({
                id: 'MarketOffers',
                title: i18n('Boxes.MarketOffers.Title'),
                auto_close: true,
                dragdrop: true,
                minimize: true,
                resize: true,
                settings: 'MarketOffers.ShowSettingsButton()'
            });

            // add css to DOM
            HTML.AddCssFile('marketoffers');
        }
        else if (!event) {
            HTML.CloseOpenBox('MarketOffers');
            return;
        }

        $('#MarketOffers').on('click', '.button-events', function () {
            MarketOffers.ShowEvents(false);
        });

        MarketOffers.CalcBody();
    },


    /**
     * Main function for all the data
     */
    CalcBody: () => {
        MarketOffers.CalcTradeSums();

        let h = [];

        h.push('<span class="btn-default button-events">' + i18n('Boxes.MarketOffers.Events') + '</span>');

        h.push('<table id="MarketOffersTable" class="foe-table sortable-table exportable">');
        h.push('<tbody class="MarketOffers">');
        h.push('<tr class="sorter-header" data-type="MarketOffers">');
        h.push('<th columnname="Era" class="is-number ascending" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.Era') + '</th>')
        h.push('<th></th>');
        h.push('<th columnname2="Good" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.Good') + '</th>');
        h.push('<th columnname="Inventory" class="is-number" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.Inventory') + '</th>');
        h.push('<th columnname="OfferSum" class="is-number" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.OfferSum') + '</th>');
        h.push('<th columnname="NeedSum" class="is-number" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.NeedSum') + '</th>');
        h.push('<th columnname="InventoryOfferSum" class="is-number" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.InventoryOfferSum') + '</th>');
        h.push('<th columnname="InventoryNeedSum" class="is-number" data-type="MarketOffers">' + i18n('Boxes.MarketOffers.InventoryNeedSum') + '</th>');
        h.push('</tr>');

        for (let i = 0; i < GoodsList.length; i++) {
            let CurrentGood = GoodsList[i],
                Era = Technologies.Eras[CurrentGood['era']],
                GoodID = CurrentGood['id'],
                Inventory = ResourceStock[GoodID],
                OfferSum = OfferSums[GoodID],
                NeedSum = NeedSums[GoodID];

            h.push('<tr>');
            h.push('<td class="is-number" data-number="' + i + '">' + i18n('Eras.' + Era) + '</td>');
            h.push('<td class="goods-image"><span class="goods-sprite-50 sm ' + GoodID + '"></span></td>');
            h.push('<td data-text="' + CurrentGood['name'].toLowerCase().replace(/[\W_ ]+/g, "") + '"><strong>' + CurrentGood['name'] + '</strong></td>');
            h.push('<td class="is-number" data-number="' + Inventory + '">' + HTML.Format(Inventory) + '</td>');
            h.push('<td class="is-number" data-number="' + OfferSum + '">' + HTML.Format(OfferSum) + '</td>');
            h.push('<td class="is-number" data-number="' + NeedSum + '">' + HTML.Format(NeedSum) + '</td>');
            h.push('<td class="is-number" data-number="' + (Inventory + OfferSum) + '">' + HTML.Format(Inventory + OfferSum) + '</td>');
            h.push('<td class="is-number" data-number="' + NeedSum + '">' + HTML.Format(Inventory + NeedSum) + '</td>');
            
            h.push('</tr>');
        }
        h.push('</tbody>');

        $('#MarketOffersBody').html(h.join(''));
        $('#MarketOffersTable.sortable-table').tableSorter();
    },


    /**
     * 
     * */
    CalcTradeSums: () => {
        OfferSums = [];
        NeedSums = [];

        for (let i = 0; i < GoodsList.length; i++) {
            let GoodID = GoodsList[i]['id'];

            OfferSums[GoodID] = 0;
            NeedSums[GoodID] = 0;
        }

        for (let i = 0; i < Market.Trades.length; i++) {
            let Trade = Market.Trades[i],
                OfferGood = Trade['offer']['good_id'],
                OfferAmount = Trade['offer']['value'],
                NeedGood = Trade['need']['good_id'],
                NeedAmount = Trade['need']['value'];

            if (!Trade['merchant']['is_self']) continue;

            OfferSums[OfferGood] += OfferAmount;
            NeedSums[NeedGood] += NeedAmount;
        }
    },


    /**
    *
    */
    ShowSettingsButton: () => {
        let h = [];
        h.push(`<p class="text-center"><button class="btn btn-default" onclick="HTML.ExportTable($('#MarketOffersBody').find('.foe-table.exportable'), 'csv', 'MarketOffers')">${i18n('Boxes.General.ExportCSV')}</button></p>`);
        h.push(`<p class="text-center"><button class="btn btn-default" onclick="HTML.ExportTable($('#MarketOffersBody').find('.foe-table.exportable'), 'json', 'MarketOffers')">${i18n('Boxes.General.ExportJSON')}</button></p>`);

        $('#MarketOffersSettingsBox').html(h.join(''));
    },


    /**
     * Create a div-box for the DOM + Eventlistener
     */
    ShowEvents: (event = true) => {
        if ($('#MarketOffersEvents').length === 0) {
            HTML.Box({
                id: 'MarketOffersEvents',
                title: i18n('Boxes.MarketOffersEvents.Title'),
                auto_close: true,
                dragdrop: true,
                minimize: true,
                resize: true,
                settings: 'MarketOffers.ShowEventsSettingsButton()'
            });

            // add css to DOM
            HTML.AddCssFile('marketoffers');
        }
        else if (!event) {
            HTML.CloseOpenBox('MarketOffersEvents');
            return;
        }              

        // Choose Neighbors/Guildmembers/Friends
        $('#MarketOffersEvents').on('click', '.toggle-tabs', function () {
            MarketOffers.CurrentEventsTab = $(this).data('value');

            MarketOffers.CalcEventsBody();
        });

        MarketOffers.CalcEventsBody();
    },


    /**
    * Main function for all the data
    */
    CalcEventsBody: async () => {
        let h = [];

        h.push('<div class="text-center dark-bg header"><strong class="title">' + i18n('Boxes.MoppelHelper.HeaderWarning') + '</strong><br></div>');
        h.push('<div class="dark-bg">');
        h.push('<div class="tabs"><ul class="horizontal">');

        h.push('<li class="' + (MarketOffers.CurrentEventsTab === 'accepted' ? 'active' : '') + '"><a class="toggle-tabs" data-value="accepted"><span>' + i18n('Boxes.MarketOffersEvents.Accepted') + '</span></a></li>');
        h.push('<li class="' + (MarketOffers.CurrentEventsTab === 'expired' ? 'active' : '') + '"><a class="toggle-tabs" data-value="expired"><span>' + i18n('Boxes.MarketOffersEvents.Expired') + '</span></a></li>');

        h.push('</ul></div></div>');

        h.push('<table id="MarketOffersEventsTable" class="foe-table sortable-table exportable">');
        h.push('</table>');

        await $('#MarketOffersEventsBody').html(h.join(''));
        MarketOffers.CalcEventsTable();
        $('#MarketOffersEventsTable.sortable-table').tableSorter();
    },


    /**
    * Main function for all the data
    */
    CalcEventsTable: async () => {
        let h = [],
            EventList = [];

        if (MarketOffers.CurrentEventsTab === 'accepted') {
            EventList = await EventHandler.db['Events'].where('eventtype').equals('trade_accepted').toArray();
        }
        else if (MarketOffers.CurrentEventsTab === 'expired') {
            EventList = await EventHandler.db['Events'].where('eventtype').equals('trade_offer_expired').toArray();
        }

        EventList = EventList.sort(function (a, b) {
            return b['date'] - a['date'];
        });

        h.push('<tbody class="MarketOffersEvents">');
        h.push('<tr class="sorter-header" data-type="MarketOffersEvents">');
        h.push('<th columnname="Date" class="is-number descending" data-type="MarketOffersEvents">' + i18n('Boxes.MarketOffersEvents.Date') + '</th>');

        h.push('<th></th>');
        h.push('<th columnname="Offered goods" data-type="MarketOffersEvents">' + i18n('Boxes.Market.OfferColumn') + '</th>');
        h.push('<th columnname="Offered amount" class="is-number" data-type="MarketOffersEvents">' + i18n('Boxes.MarketOffersEvents.Count') + '</th>');

        h.push('<th></th>');
        h.push('<th columnname="Requested goods" data-type="MarketOffersEvents">' + i18n('Boxes.Market.NeedColumn') + '</th>');
        h.push('<th columnname="Requested amount" class="is-number" data-type="MarketOffersEvents">' + i18n('Boxes.MarketOffersEvents.Count') + '</th>');

        h.push('<th columnname="Rate" class="is-number" data-type="MarketOffersEvents">' + i18n('Boxes.Market.RateColumn') + '</th>');
        if (MarketOffers.CurrentEventsTab === 'accepted') h.push('<th columnname="Player" data-type="MarketOffersEvents">' + i18n('Boxes.Market.PlayerColumn') + '</th>');
        h.push('</tr>');

        for (let i = 0; i < EventList.length; i++) {
            let Event = EventList[i];

            if (!Event['offer'] || !Event['need']) continue;

            let OfferGoodID = Event['offer']['good_id'],
                NeedGoodID = Event['need']['good_id'],
                OfferEra = Technologies.Eras[GoodsData[OfferGoodID]['era']],
                NeedEra = Technologies.Eras[GoodsData[NeedGoodID]['era']],
                OfferTT = HTML.i18nReplacer(i18n('Boxes.Market.OfferTT'), { 'era': i18n('Eras.' + OfferEra), 'stock': HTML.Format(ResourceStock[OfferGoodID]) }),
                NeedTT = HTML.i18nReplacer(i18n('Boxes.Market.NeedTT'), { 'era': i18n('Eras.' + NeedEra), 'stock': HTML.Format(ResourceStock[NeedGoodID]) }),
                PlayerID = Event['playerid'],
                PlayerName = Event['playername'];

            if (!OfferGoodID || !NeedGoodID) continue;

            h.push('<tr>');
            h.push('<td class="is-number" data-number="' + (Event['date'].getTime()) + '">' + (Event['date'] ? moment.unix(Event['date'] / 1000).format(i18n('DateTime')) : i18n('Boxes.MarketOffersEvents.DateNA')) + '</td>');

            h.push('<td class="goods-image"><span class="goods-sprite-50 sm ' + GoodsData[OfferGoodID]['id'] + '"></span></td>');
            h.push('<td data-text="' + GoodsData[OfferGoodID]['name'].toLowerCase().replace(/[\W_ ]+/g, "") + '"><strong class="td-tooltip" title="' + HTML.i18nTooltip(OfferTT) + '">' + GoodsData[OfferGoodID]['name'] + '</strong></td>');
            h.push('<td class="is-number" data-number="' + Event['offer']['value'] + '"><strong class="td-tooltip" title="' + HTML.i18nTooltip(OfferTT) + '">' + Event['offer']['value'] + '</strong></td>');

            h.push('<td class="goods-image"><span class="goods-sprite-50 sm ' + GoodsData[NeedGoodID]['id'] + '"></span></td>');
            h.push('<td data-text="' + GoodsData[OfferGoodID]['name'].toLowerCase().replace(/[\W_ ]+/g, "") + '"><strong class="td-tooltip" title="' + HTML.i18nTooltip(NeedTT) + '">' + GoodsData[NeedGoodID]['name'] + '</strong></td>');
            h.push('<td class="is-number" data-number="' + Event['need']['value'] + '"><strong class="td-tooltip" title="' + HTML.i18nTooltip(NeedTT) + '">' + Event['need']['value'] + '</strong></td>');

            h.push('<td class="text-center" data-number="' + Event['offer']['value'] / Event['need']['value'] + '">' + HTML.Format(MainParser.round(Event['offer']['value'] / Event['need']['value'] * 100) / 100) + '</td>');
            if (MarketOffers.CurrentEventsTab === 'accepted') h.push('<td data-text="' + PlayerName.toLowerCase().replace(/[\W_ ]+/g, "") + '">' + MainParser.GetPlayerLink(PlayerID, PlayerName) + '</td>');
            h.push('</tr>');
        }

        h.push('</tbody>');

        await $('#MarketOffersEventsTable').html(h.join(''));

        $('.td-tooltip').tooltip({
            html: true,
            container: '#MarketOffersEvents'
        });
    },


    /**
    *
    */
    ShowEventsSettingsButton: () => {
        let h = [];
        h.push(`<p class="text-center"><button class="btn btn-default" onclick="HTML.ExportTable($('#MarketOffersEventsBody').find('.foe-table.exportable'), 'csv', 'MarketOffersEvents')">${i18n('Boxes.General.ExportCSV')}</button></p>`);
        h.push(`<p class="text-center"><button class="btn btn-default" onclick="HTML.ExportTable($('#MarketOffersEventsBody').find('.foe-table.exportable'), 'json', 'MarketOffersEvents')">${i18n('Boxes.General.ExportJSON')}</button></p>`);

        $('#MarketOffersEventsSettingsBox').html(h.join(''));
    },
};
