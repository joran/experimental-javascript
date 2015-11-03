import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(responses){
    const USERS_URL = "http://localhost:3000/users/userlist"
    const USERS_ADD_URL = "http://localhost:3000/users/adduser"

    // -- Intent --
    let getUser$ = Cycle.Rx.Observable.just("")
        .map(() => {
            return {
                url: USERS_URL,
                method: "GET"
            }
        });

    let showUser$ = responses.DOM.select('.linkshowuser').events('click')
        .map(ev => ev.target.rel)
        .startWith(null)

    let addUser$ = responses.DOM.select('button.btnAddUser').events('click')
        .map(ev => true)
        .startWith(false);

    let userChanges = [
        responses.DOM.select('input.inputUserName').events('input')
            .map(ev => ev.target.value)
            .startWith(''),
        responses.DOM.select('input.inputUserEmail').events('input')
            .map(ev => ev.target.value)
            .startWith(''),
        responses.DOM.select('input.inputUserFullname').events('input')
            .map(ev => ev.target.value)
            .startWith(''),
        responses.DOM.select('input.inputUserAge').events('input')
            .map(ev => ev.target.value)
            .startWith(''),
        responses.DOM.select('input.inputLocationAge').events('input')
            .map(ev => ev.target.value)
            .startWith(''),
        responses.DOM.select('input.inputGenderAge').events('input')
            .map(ev => ev.target.value)
            .startWith('')
        ];


    // -- Model --
    let addUserModel$ = addUser$.withLatestFrom(userChanges,
        function(click, username, email, fullname,age,location,gender){
            return {username, email, fullname,age,location,gender}
        }
    )

    let receivedUser$ = responses.HTTP
        .tap(resp => console.log("RESPONSE 1", JSON.stringify(resp)))
        .filter(res$ => res$.request.url.indexOf(USERS_URL) === 0)
        .mergeAll()
        .map(res => res.body)
        .startWith([])
        .tap(resp => console.log("RESPONSE", JSON.stringify(resp)));

    let usersModel$ = receivedUser$
        .flatMap(Cycle.Rx.Observable.fromArray)
        .merge(addUserModel$.filter(u => u.username.length > 0 ))
        .map(u => function(oldList){
            return oldList.concat([u])
        })
        .startWith([])
        .scan(function(acc, mod){
            return mod(acc);
        })
        .tap(x => console.log("usersModel", JSON.stringify(x)))

    let selectedUserModel$ =
        showUser$.withLatestFrom([usersModel$],
            function(selUserId, users){
                let selUsers = users.filter(u => u.username === selUserId);
                let selUser = {};
                if(selUsers.length > 0){
                    selUser = selUsers[0];
                }
                return selUser;
            }
        )
        .tap(x => console.log("selectedUserModel tap", JSON.stringify(x)));

    let state = {
        selectedUser$: selectedUserModel$,
        users$: usersModel$
    }

    // -- View --
    // addUserModel$.subscribe(function(x){
    //     let clearValueOnElement = function(selector){
    //         let elemUsername = document.querySelector(selector);
    //         if(elemUsername){
    //                 elemUsername.value="";
    //         }
    //     };
    //     console.log("addUserModel subscribe", x);
    //     [
    //         "input.inputUserName",
    //         "input.inputUserEmail",
    //         "input.inputUserFullname",
    //         "input.inputUserAge",
    //         "input.inputUserLocation",
    //         "input.inputUserGender"
    //     ].forEach(clearValueOnElement)
    //
    // });

    let inputSelectors =
    [
        "input.inputUserName",
        "input.inputUserEmail",
        "input.inputUserFullname",
        "input.inputUserAge",
        "input.inputUserLocation",
        "input.inputUserGender"
    ];

    // let inputSelector$ = Cycle.Rx.Observable.just(inputSelectors);
    // addUserModel$.combineLatest(inputSelector$).subscribe(x => console.log("addUserModel$.subscribe", x))

    let vtree$ = Cycle.Rx.Observable.just([]).map(x =>
        h('div', [
            h('h1', 'Cycle.js app client'),
            h('p', 'Welcome to our test'),
            h('div#wrapper', [
                h('div#userInfo', [
                    h('h2', 'User Info'),
                    h('p', state.selectedUser$.map(u =>
                        h('div',[
                            h('strong', 'Name: '),
                            h('span#userInfoName', u.username),
                            h('br'),
                            h('strong', 'Age: '),
                            h('span#userInfoAge', ""+(u.age||"")),
                            h('br'),
                            h('strong', 'Gender: '),
                            h('span#userInfoGender', u.gender),
                            h('br'),
                            h('strong', 'Location: '),
                            h('span#userInfoLocation', u.location)
                        ])
                    ))
                ]), // div#userInfo
                h('div#userList', [
                    h('h2', 'User List'),
                ].concat(state.users$.map(users =>
                    h('table', [
                        h('thead',[
                            h('tr', [
                                h('th', 'Username'),
                                h('th', 'Email'),
                                h('th', 'Delete')
                            ])
                        ]),
                        h('tbody', users.map(user =>
                            h('tr', [
                                h('td', h('a.linkshowuser', {href:"#", rel:user.username}, user.username)),
                                h('td', user.email),
                                h('td', h('a.linkdeleteuser', {href:"#", rel:user._id}, 'delete'))
                            ])
                        )
                    )
                    ]) // table
                ))), //div#userInfo
                h('div.addUser', [
                    h('h2', 'Add user'),
                    h('fieldset', [
                        h('input.inputUserName', {type:'text', placeholder:'Username', value:'asdf'}),
                        h('input.inputUserEmail', {type:'text', placeholder:'Email'}),
                        h('br'),
                        h('input.inputUserFullname', {type:'text', placeholder:'Full name'}),
                        h('input.inputUserAge', {type:'text', placeholder:'Age'}),
                        h('br'),
                        h('input.inputUserLocation', {type:'text', placeholder:'Location'}),
                        h('input.inputUserGender', {type:'text', placeholder:'gender'}),
                        h('br'),
                        h('button.btnAddUser', 'Add User')
                    ])
                ]) // div#addUser
            ]) // div#wrapper
        ]) // div
    );

    return{
        DOM: vtree$,
        HTTP: getUser$
        .merge(addUserModel$
            .filter(u => u.username.length > 0 )
            .map(u => {
                return {
                    url: USERS_ADD_URL,
                    method: "POST",
                    send: u
                }
            }))
        }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
