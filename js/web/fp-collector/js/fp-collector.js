/*
 * **************************************************************************************
 *
 * Dateiname:                 fp-collector.js
 * Projekt:                   foe-chrome
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * erstellt am:	              28.11.20, 21:29 Uhr
 * zuletzt bearbeitet:       28.11.20, 21:25 Uhr
 *
 * Copyright © 2020
 *
 * **************************************************************************************
 */

// - GG reward after fight [2,5,10]FP or
// - diplomaticGift or spoilsOfWar
FoEproxy.addHandler('RewardService', 'collectReward', (data, postData) => {

	const d = data.responseData[0][0];

	if(d['subType'] !== 'strategy_points'){
		return;
	}

	StrategyPoints.insertIntoDB({
		place: 'Guildfights',
		event: ( data['responseData'][1] ? data['responseData'][1] : 'reward'),
		amount: d['amount'],
		date: moment(MainParser.getCurrentDate()).startOf('day').toDate()
	});
});

// GEX FP from chest
FoEproxy.addHandler('GuildExpeditionService', 'openChest', (data, postData) => {
	const d = data['responseData'];

	if(d['subType'] !== 'strategy_points'){
		return;
	}

	StrategyPoints.insertIntoDB({
		place: 'Guildexpedition',
		event: 'chest',
		amount: d['amount'],
		date: moment(MainParser.getCurrentDate()).startOf('day').toDate()
	});
});

// Visit other tavern
FoEproxy.addHandler('FriendsTavernService', 'getOtherTavern', (data, postData) => {
	const d = data['responseData'];

	if(!d['rewardResources'] || !d['rewardResources']['resources'] || !d['rewardResources']['resources']['strategy_points']){
		return;
	}

	StrategyPoints.insertIntoDB({
		place: 'FriendsTavern',
		event: 'satDown',
		amount: d['rewardResources']['resources']['strategy_points'],
		date: moment(MainParser.getCurrentDate()).startOf('day').toDate()
	});
});

// double Collection by Blue Galaxy
FoEproxy.addHandler('CityMapService', 'showEntityIcons', (data, postData) => {

	if(data['responseData'][0]['type'] !== 'citymap_icon_double_collection'){
		return;
	}

	StrategyPoints.pickupProductionId = data['responseData'][0]['id'];
});


FoEproxy.addHandler('OtherPlayerService', 'rewardPlunder', (data, postData) => {
	for (let i = 0; i < data.responseData.length; i++) {
		let PlunderReward = data.responseData[i];

		if (PlunderReward['product'] && PlunderReward['product']['resources'] && PlunderReward['product']['resources']['strategy_points']) {
			let PlunderedFP = PlunderReward['product']['resources']['strategy_points'];

			StrategyPoints.insertIntoDB({
				place: 'OtherPlayer',
				event: 'plunderReward',
				amount: PlunderedFP,
				date: moment(MainParser.getCurrentDate()).startOf('day').toDate()
			});
		}
	}
});


FoEproxy.addHandler('CityProductionService', 'pickupProduction', (data, postData) => {

	if(!StrategyPoints.pickupProductionId){
		return;
	}

	const pickUpID = StrategyPoints.pickupProductionId;
	const d = data['responseData']['updatedEntities'];

	for(let i in d)
	{
		if(!d.hasOwnProperty(i)) continue;

		if(pickUpID !== d[i]['id']){
			return ;
		}

		let id = d[i]['cityentity_id'],
			name = MainParser.CityEntities[id]['name'],
			amount;

		// Eventbuildings
		if(d[i]['type'] === 'residential')
		{
			// has this building forge points?
			if(!d[i]['state']['current_product']['product']['resources']['strategy_points']){
				return;
			}

			amount = d[i]['state']['current_product']['product']['resources']['strategy_points'];
		}

		// Production building like Terrace fields
		else {
			let level = d[i]['level'],
				products = MainParser.CityEntities[id]['entity_levels'][level]['production_values'];

			const product = Object.values(products).filter(f => f['type'] === 'strategy_points');

			amount = product[0]['value'];
		}

		StrategyPoints.insertIntoDB({
			place: 'pickupProduction',
			event: 'double_collection',
			notes: name,
			amount: amount,
			date: moment(MainParser.getCurrentDate()).startOf('day').toDate()
		});
	}

	// reset
	StrategyPoints.pickupProductionId = null;
});


/**
 *
 * @type {{maxDateFilter: Date, buildBody: (function(): Promise<void>), caclculateTotal: (function(*=): Promise<number>), iniatateDatePicker: (function(): Promise<undefined>), currentDateFilter: Date, DatePicker: null, ShowFPCollectorBox: FPCollector.ShowFPCollectorBox, minDateFilter: null}}
 */
let FPCollector = {

	minDateFilter: null,
	maxDateFilter: moment(MainParser.getCurrentDate()).toDate(),
	currentDateFilter: moment(MainParser.getCurrentDate()).startOf('day').toDate(),

	DatePicker: null,

	ShowFPCollectorBox: ()=> {

		if( $('#fp-collector').length < 1 )
		{
			// CSS into the DOM
			HTML.AddCssFile('fp-collector');

			HTML.Box({
				id: 'fp-collector',
				title: i18n('Menu.fpCollector.Title'),
				auto_close: true,
				dragdrop: true,
				resize: true,
				minimize: true
			});

			// set the first possible date for date picker
			StrategyPoints.db['ForgePointsStats'].orderBy('id').first().then((resp) => {
				FPCollector.minDateFilter = moment(resp.date).subtract(1, 'minute').toDate();
			});

			// max Date
			FPCollector.maxDateFilter = moment(MainParser.getCurrentDate()).add(1, 'day').toDate();

			$('#fp-collectorBody').append(
				`<div class="dark-bg head">
					<div class="text-warning"><strong>${i18n('Boxes.FPCollector.TotalFP')}: <span id="fp-collector-total-fp"></span></strong></div>
					<div class="text-right"><button class="btn btn-default" id="FPCollectorPicker">${moment(FPCollector.currentDateFilter).format(i18n('Date'))}</button></div>
				</div>`,
				`<div id="fp-collectorBodyInner"></div>`
			);
		}

		FPCollector.buildBody();
	},


	buildBody: async ()=> {

		let tr = [],
			entries = await StrategyPoints.db['ForgePointsStats'].where('date').equals(FPCollector.currentDateFilter).toArray();

		$('#fp-collector-total-fp').text(await FPCollector.caclculateTotal(FPCollector.currentDateFilter));

		tr.push('<table class="foe-table">');

		tr.push(`<thead>
			<tr>
				<th>FPs</th>
				<th>${i18n('Boxes.FPCollector.Where')}</th>
				<th>${i18n('Boxes.FPCollector.Who')}</th>
				<th>${i18n('Boxes.FPCollector.What')}</th>
			</tr>
		</thead>`);

		tr.push(`<tbody>`);

		if(!entries)
		{
			tr.push(`<tr><td colspan="2" class="text-center"><em>${i18n('Boxes.FPCollector.NoEntriesFound')}</em></td></tr>`);
		}
		else {

			entries.forEach(e => {

				tr.push(`<tr>
					<td>
						<strong class="text-warning">${e.amount}</strong>
					</td>
					<td>${i18n('Boxes.FPCollector.' + e.place)}</td>
					<td>${i18n('Boxes.FPCollector.' + e.event)}</td>
					<td>${e.notes ? e.notes : ''}</td>
				</tr>`);

			});
		}

		tr.push(`</tbody>`);
		tr.push(`</table>`);

		$('#fp-collectorBodyInner').html(tr.join('')).promise().done(function(){
			FPCollector.iniatateDatePicker();
		});
	},


	caclculateTotal: async (date)=> {
		let totalFP = 0;

		await StrategyPoints.db['ForgePointsStats']
			.where('date')
			.equals(date)
			.each (entry => totalFP += entry.amount);

		return totalFP;
	},


	iniatateDatePicker: async () => {

		if(FPCollector.DatePicker !== null){
			return ;
		}

		FPCollector.DatePicker = new Litepicker({
			element: document.getElementById('FPCollectorPicker'),
			format: i18n('Date'),
			lang: MainParser.Language,
			singleMode: true,
			splitView: false,
			numberOfMonths: 1,
			numberOfColumns: 1,
			autoRefresh: true,
			minDate: FPCollector.minDateFilter,
			maxDate: FPCollector.maxDateFilter,
			showWeekNumbers: true,
			onSelect: async (date)=> {
				$('#FPCollectorPicker').text(`${moment(date).format(i18n('Date'))}`);

				FPCollector.currentDateFilter = moment(date).toDate();
				await FPCollector.buildBody();
			}
		});
	}
};