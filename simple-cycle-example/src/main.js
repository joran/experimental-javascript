import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

  function inputWidget(responses){
    function intent(DOM){
      return {
        value$: DOM.select('#input2').events('input')
        .map(ev => ev.target.value)
      }
    };

    function model(context, actions){
      let initialValue$ = context.props.get('initial').first();
      let value$ = initialValue$.concat(actions.value$);
      let props$ = context.props.getAll();
      return Cycle.Rx.Observable.combineLatest(props$, value$,
        (props, value) => { console.log("MODEL", value);return {props, value}; }
      );
    };

    function view(state$){
      return state$.map(function({props, value}){
        console.log("VIEW",value)
      return h('input', {attributes:{type:'text', value:value, id:props.id}})
    });
    };

    let actions = intent(responses.DOM);
    let vtree$ = view(model(responses, actions));

    return {
      DOM: vtree$,
      events: {
        newValue: actions.value$
      }
    }
  }

  //-------------------------- --------------------------------------------------

  function intent(DOM){
    return {
      name$: DOM.select('.myinput').events('input')
     .map(ev => ev.target.value),
      name2$: DOM.select('#input2').events('newValue')
      .map(ev => ev.detail)
    }
  };

  function model(actions){
    return actions.name2$.startWith('');
  };

  function view(state$){
    return state$.map(name =>
      h('div', [
        h('label', 'Name:'),
        h('input.myinput', {attributes: {type: 'text'}}),
        h('hr'),
        h('inputWidget', {key:1, initial:'aa', id:'input2'}),
        h('h1', `Hello ${name}`)
      ])
    )
  };


function main(responses){
  return {DOM: view(model(intent(responses.DOM)))};
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container', {
    'inputWidget':inputWidget
  })
});
