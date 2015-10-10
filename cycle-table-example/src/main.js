import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';


function main(responses){

  //----------------------------------------------------------------------------
  // New Product provider
  //----------------------------------------------------------------------------
  const np = function(){
      function intent(DOM){
        return {
          add$: DOM.select('.addNewProduct').events('click')
            .map(ev => true)
            .startWith(false),
          idChange$: DOM.select('.newProductId')
            .events('input')
            .map(ev => ev.target.value)
            .startWith(''),
          nameChange$: DOM.select('.newProduct .newProductName')
            .events('input')
            .map(ev => ev.target.value)
            .startWith(''),
          qtyChange$: DOM.select('.newProduct .newProductQty')
            .events('input')
            .map(ev => ev.target.value)
            .startWith('')
        }
      };

      function model(action){
        let obs = [
          action.idChange$,
          action.nameChange$,
          action.qtyChange$
        ];

        return {
          add$: action.add$.withLatestFrom(obs, function(click, pid, product, qty){ return {pid,product,qty}}),
          internal$: Cycle.Rx.Observable.combineLatest(obs, function(pid, product, qty){ return {pid,product,qty}})
        }
      }

      function view(state){
        return h('div.newProduct', [
        h('input.newProductId'),
        h('input.newProductName'),
        h('input.newProductQty'),
        h('button.addNewProduct', "Add"),
        state.internal$.map(state => h('div', 'Internal event content: ' + JSON.stringify(state))),
        state.add$.map(state => h('div', "ADD event content: "+JSON.stringify(state)))
      ])
      };

      return {intent, model, view};
  }();
  //----------------------------------------------------------------------------
  let npState = np.model(np.intent(responses.DOM))
  let insertNewProduct$ = npState.add$
    .filter(prod => prod.pid.trim().length > 0).map(prod => function(oldList){
    return oldList.concat(prod)
  })

  const products = [
  {pid:2, product:"blackberry", qty:500},
    {pid:3, product:"cloudberry", qty:2000},
    {pid:4, product:"strawberry", qty:5000},
    {pid:5, product:"blueberry", qty:4500},
    {pid:7, product:"rasberry", qty:3700},
    {pid:8, product:"lingonberry", qty:4200}
  ];

  const insertMod$ = Cycle.Rx.Observable.interval(5000).take(products.length)
    .map(i => function(oldList){
      return oldList.concat([products[i]])
    });

  const state$= insertMod$
    .startWith([])
    .merge(insertNewProduct$)
    .scan((acc, mod) => mod(acc));

  const headers = [h('tr', [h('th', 'ID'),h('th', 'PRODUCT'),h('th', 'QTY')])];

  function productView(p){
    return h('tr', [h('td', `${p.pid}`),h('td', p.product),h('td', `${p.qty}`)]);
  };

  function productsView(prods){
    return prods.length ?
      h('table.table .table-striped .table-borderd', headers.concat(prods.map(productView))) :
      h('h3', 'Loading..')
  };


  return {DOM:Cycle.Rx.Observable.just([]).map(x =>
    h('div', [
      state$.map(prods =>  productsView(prods)),
      np.view(npState)
    ])
  )};
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
