<template>
    <div id="app">
        <template v-if="!isAuthorized">
            <authorization @login="login"/>
        </template>
        <template v-else>
            <overview v-bind:lobbies-history="lobbiesHistory"
                      @logout="logout"
                      @connect="connect"
                      @disconnect="disconnect"
                      @sync="sync"
                      @unsync="unsync"/>
        </template>
    </div>
</template>

<script>
  import Authorization from './Authorization';
  import Overview from './Overview';
  import {browser} from '../browserApi';
  import {UNSYNC_WITH_LOBBY, CONNECT_TO_LOBBY, DISCONNECT_FROM_LOBBY, SYNC_WITH_LOBBY} from '../messageTypes';

  export default {
    name: 'app',
    data() {
      return {
        user: null,
        lobbiesHistory: null,
      };
    },
    components: {
      Authorization,
      Overview,
    },
    watch: {
      user(value) {
        browser.storage.sync.set({user: value});
      },
    },
    computed: {
      isAuthorized() {
        return this.user;
      },
    },
    mounted() {
      browser.storage.sync.get(['user', 'lobbiesHistory'], ({user, lobbiesHistory}) => {
        this.user = user;
        this.lobbiesHistory = lobbiesHistory;
      });
      browser.storage.onChanged.addListener(({user, lobbiesHistory}) => {
        if (user) {
          this.user = user.newValue;
        }
        if (lobbiesHistory) {
          this.lobbiesHistory = lobbiesHistory.newValue;
        }
      });
    },
    methods: {
      login(user) {
        this.user = user;
      },
      logout() {
        this.user = null;
      },
      connect(lobbyId) {
        browser.runtime.sendMessage({
          type: CONNECT_TO_LOBBY,
          payload: {
            lobbyId,
          },
        });
      },
      disconnect(lobbyId) {
        browser.runtime.sendMessage({
          type: DISCONNECT_FROM_LOBBY,
          payload: {
            lobbyId,
          },
        });
      },
      sync(lobbyId) {
        browser.tabs.query({active: true, currentWindow: true}, tabs => {
          chrome.tabs.sendMessage(
              tabs[0].id,
              {
                type: SYNC_WITH_LOBBY,
                payload: {
                  lobbyId,
                  videoIdentity: this.lobbiesHistory[lobbyId].videoIdentity,
                },
              },
              isConnected => {
                if (isConnected) {
                  console.log('Synced!');
                }
                else {
                  console.log('Not synced!');
                }
              },
          );
        });
      },
      unsync(lobbyId) {
        browser.tabs.query({}, tabs => {
          tabs.forEach(tab => browser.tabs.sendMessage(tab.id, {type: UNSYNC_WITH_LOBBY, payload: {lobbyId}}));
        });
      },
    },
  };
</script>

<style lang="css">
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        width: 250px;
        height: 100px;
    }
</style>