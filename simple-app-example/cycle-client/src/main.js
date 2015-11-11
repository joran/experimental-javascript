import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(responses){
    const USERS_URL = "http://localhost:3000/users/userlist"
    const USER_ADD_URL = "http://localhost:3000/users/adduser"
    const USER_DELETE_URL = "http://localhost:3000/users/deleteuser"

    // -- Intent --
    let selectUser$ = responses.DOM.select('.linkshowuser').events('click')
        .map(ev => ev.target.rel)
        .startWith(null)

    let removeUser$ = responses.DOM.select('a.linkdeleteuser').events('click')
        .map(ev => ev.target.rel)
        .startWith(null);

    let addUser$ = responses.DOM.select('button.btnAddUser').events('click')
        .map(ev => true)
        .startWith(false);

    let userInputChange$ = [
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
        responses.DOM.select('input.inputUserLocation').events('input')
            .map(ev => ev.target.value)
            .startWith(''),
        responses.DOM.select('input.inputUserGender').events('input')
            .map(ev => ev.target.value)
            .startWith('')
        ];

        let addNewUser$ = addUser$.withLatestFrom(userInputChange$,
            function(click, username, email, fullname,age,location,gender){
                return {username, email, fullname,age,location,gender}
            }
        )

    // -- Model --
    const Operation = {
      addUser: newUser => state => ({
        user$: state.user$.concat(newUser),
        selectedUser$: state.selectedUser$
      }),
      removeUser: userNameToRemove => state => ({
        user$: state.user$.filter(user => user.userName !== userNameToRemove),
        selectedUser$: state.selectedUser$
      }),
      setAllUsers: users => state => ({
        user$: users,
        selectedUser$: state.selectedUser$
      }),
      setSelectedUser: selectedUsername => state => ({
        user$: state.user$,
        selectedUser$: state.user$.filter(user => user.username === selectedUsername)
      }),
      initialState: {
        user$: [],
        selectedUser$: []
      }
    };

    let receivedGetUsers$ = responses.HTTP
        .filter(res$ => res$.request.url.indexOf(USERS_URL) === 0)
        .mergeAll()
        .map(res => res.body)
        .startWith([])

    let receivedAddUser$ = responses.HTTP
        .filter(res$ => res$.request.url.indexOf(USER_ADD_URL) === 0)
        .mergeAll()
        .map(res => res.body)
        .startWith([])

    let receivedDeleteUser$ = responses.HTTP
        .filter(res$ => res$.request.url.indexOf(USER_DELETE_URL) === 0)
        .mergeAll()
        .map(res => res.body)
        .startWith([]);


    let setAllUsersOperation$ = receivedGetUsers$
      .merge(receivedAddUser$)
      .merge(receivedDeleteUser$)
      .map(users => Operation.setAllUsers(users));
//    let removeUserOperation$ = removeUser$.map(username => Operation.removeUser(username));
    let selectedUserOperation$ = selectUser$.map(username => Operation.setSelectedUser(username))

    let allOperations$ = Cycle.Rx.Observable.merge(
      setAllUsersOperation$,
//      removeUserOperation$,
      selectedUserOperation$
    )

    let state$ = allOperations$
      .scan((state, operation) => operation(state), Operation.initialState)

    // -- View --

    let vtree$ = state$.map(state =>
        h('div', [
            h('h1#main-header', 'Cycle.js app client'),
            h('p#main-text', 'Welcome to our test'),
            h('div#wrapper', [
                h('div#userInfo', [
                    h('h2#userInfo-header', 'User Info'),
                    h('p#selectedUser-block', state.selectedUser$.map(u =>
                        h('div#selectedUser-container',[
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
                    h('table', [
                        h('thead',[
                            h('tr', [
                                h('th', 'Username'),
                                h('th', 'Email'),
                                h('th', 'Delete')
                            ])
                        ]),
                      h('tbody', state.user$.map( user =>
                          h('tr', [
                              h('td', h('a.linkshowuser', {href:"#", rel:user.username}, user.username)),
                              h('td', user.email),
                              h('td', h('a.linkdeleteuser', {href:"#", rel:user.username}, 'delete'))
                          ])
                        ))
                      ]) // table
                ]), // div#userList
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

    let getUser$ = Cycle.Rx.Observable.just("")
        .map(() => {
            return {
                url: USERS_URL,
                method: "GET"
            }
        });

    let postNewUser = addNewUser$
      .filter(u => u.username.length > 0 )
      .map(u => {
          return {
            url: USER_ADD_URL,
            method: "POST",
            send: u
          }
      });
    let deleteUser = removeUser$
        .filter(id => id != null && id != undefined )
        .map(id => USER_DELETE_URL+"/"+id)
        .tap(x => console.log("tap deleteUser", x))
        .map(id => {
            return {
              url: id,
              method: "GET"
            }
        });

    return{
        DOM: vtree$,
        HTTP: getUser$
        .merge(postNewUser)
        .merge(deleteUser)
    }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
