<template>
    <div id="app">
        <header class=dashboard>
            <img class="project-icon" src="../assets/video-camera.svg"/>
            <p class="project-name">Team Watch</p>
            <div class="right-bar">
                <template v-if="!user">
                    <button class="round-btn user-back signin-onhover-back"
                            @click="signIn" title="Sign in"></button>
                </template>
                <template v-else>
                    <button class="round-btn add-back" @click="create" title="Create lobby"></button>
                    <button class="round-btn user-back signout-onhover-back"
                            :style="authButtonHovered?{}:{backgroundImage:'url('+user.photo+')'}"
                            @mouseenter="authButtonHovered=true" @mouseleave="authButtonHovered=false"
                            @click="signOut" title="Sign out"></button>
                </template>
            </div>
        </header>
        <div class="lobby-list">
            <div class="lobby-list-item" v-for="lobby in sortedLobbies" :key="lobby.id">
                <span class="lobby-name">{{lobby.name}}</span>
                <button class="btn copy-back" style="margin-left: auto" @click="copyLink(lobby.id)"
                        title="Copy link to lobby."></button>
                <template v-if="!lobby.isConnected">
                    <button class="btn green-back" @click="connect(lobby.id)" title="Connect to lobby.">Connect</button>
                    <button class="btn red-back" @click="remove(lobby.id)" title="Remove lobby.">Remove</button>
                </template>
                <template v-else>
                    <button v-if="!lobby.isSynced" class="btn blue-back" @click="sync(lobby.id)"
                            title="Sync video with lobby.">Sync
                    </button>
                    <button v-else class="btn blue-back" @click="unsync(lobby.id)" title="Unsync video.">Unsync</button>
                    <button class="btn red-back" @click="disconnect(lobby.id)" title="Disconnect from lobby.">
                        Disconnect
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
  import copy from 'copy-text-to-clipboard';
  import {browser} from '../browserApi';
  import {
    CONNECT_LOBBY,
    CREATE_LOBBY,
    DISCONNECT_LOBBY,
    REMOVE_LOBBY,
    SIGN_IN,
    SYNC_LOBBY,
    UNSYNC_LOBBY,
  } from '../messageTypes';

  export default {
    name: 'app',
    data() {
      return {
        authButtonHovered: false,
        user: null,
        lobbiesHistory: {},
        currentTabId: null,
      };
    },
    computed: {
      sortedLobbies() {
        return Object.entries(this.lobbiesHistory).
            map(([id, details]) =>
                Object.assign({}, details, {
                  id,
                  isConnected: details.hasOwnProperty('videoIdentity'),
                  isSynced: details.hasOwnProperty('tabId'),
                })).
            sort((lobby1, lobby2) => {
              if (lobby2.isConnected - lobby1.isConnected !== 0)
                return lobby2.isConnected - lobby1.isConnected;
              if (lobby1.isConnected && (lobby2.isSynced - lobby1.isSynced) !== 0)
                return lobby2.isSynced - lobby1.isSynced;
              return lobby1.name.localeCompare(lobby2.name);
            });
      },
    },
    beforeCreate() {
      browser.tabs.onActivated.addListener(({tabId}) => this.currentTabId = tabId);
      browser.tabs.query({active: true, currentWindow: true}, ([tab]) => this.currentTabId = tab.id);
      browser.storage.sync.get(['user', 'lobbiesHistory'], ({user, lobbiesHistory}) => {
        this.user = user;
        this.lobbiesHistory = lobbiesHistory || {};
      });
      browser.storage.onChanged.addListener(({user, lobbiesHistory}) => {
        if (user)
          this.user = user.newValue;
        if (lobbiesHistory)
          this.lobbiesHistory = lobbiesHistory.newValue;
        console.log(lobbiesHistory);
      });
    },
    methods: {
      signIn() {
        browser.runtime.sendMessage({type: SIGN_IN});
      },
      signOut() {
        this.user = null;
        browser.storage.sync.set({user: null});
      },
      create() {
        browser.tabs.query({active: true, currentWindow: true}, ([tab]) => {
          browser.tabs.sendMessage(
              tab.id,
              {type: CREATE_LOBBY},
              isCreated => {
                if (isCreated)
                  console.log('Created!');
                else
                  console.log('Not created!');
              },
          );
        });
      },
      copyLink(lobbyId) {
        copy(`team.watch/${lobbyId}`);
      },
      connect(lobbyId) {
        browser.runtime.sendMessage({
          type: CONNECT_LOBBY,
          payload: {lobbyId},
        });
      },
      disconnect(lobbyId) {
        this.unsync(lobbyId);
        browser.runtime.sendMessage({
          type: DISCONNECT_LOBBY,
          payload: {lobbyId},
        });
      },
      sync(lobbyId) {
        browser.tabs.query({active: true, currentWindow: true}, ([tab]) => {
          browser.tabs.sendMessage(
              tab.id,
              {
                type: SYNC_LOBBY,
                payload: {
                  lobbyId,
                  videoIdentity: this.lobbiesHistory[lobbyId].videoIdentity,
                },
              },
              isConnected => {
                if (isConnected)
                  console.log('Synced!');
                else
                  console.log('Not synced!');
              },
          );
        });
      },
      unsync(lobbyId) {
        browser.tabs.query({}, tabs => {
          tabs.forEach(tab => browser.tabs.sendMessage(
              tab.id,
              {
                type: UNSYNC_LOBBY,
                payload: {lobbyId},
              },
          ));
        });
      },
      remove(lobbyId) {
        browser.runtime.sendMessage({
          type: REMOVE_LOBBY,
          payload: {lobbyId},
        });
      },
    },
  };
</script>

<style>
    body {
        margin: 0;
    }

    #app {
        font-family: 'Roboto', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        width: 320px;
        height: 360px;
    }

    .dashboard {
        display: flex;
        margin-top: 3px;
        background-color: #2c3e50;
        height: 40px;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.19);
        flex-direction: row;
    }

    .lobby-list-item {
        display: flex;
        width: 100%;
        height: 39px;
        flex-direction: row;
        align-items: center;
        border-bottom: 1px solid #ebebeb;
    }

    .lobby-list-item:hover {
        background: #f8f8f8;
        box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.14), 0 0 6px 4px rgba(0, 0, 0, 0.13);
    }

    .lobby-name {
        overflow: hidden;
        margin: 5px 9px 5px;
        font-size: unset;
        width: 120px;
        height: 26px;
        text-overflow: ellipsis;
        cursor: default;
    }

    .btn {
        flex-shrink: 1;
        height: 26px;
        margin: 0 7px 0 0;
        border: 0;
        background: #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    .green-back {
        background: #8e9;
    }

    .red-back {
        background: #e98;
    }

    .blue-back {
        background: #9ce;
    }

    .copy-back {
        width: 26px;
        background: url(../assets/share.svg) no-repeat center;
        background-size: 22px 22px;
    }

    .right-bar {
        position: absolute;
        right: 7px;
        top: 9px;
    }

    .round-btn {
        margin: 0 4px;
        border-radius: 50%;
        height: 26px;
        width: 26px;
        border: 2px solid transparent;
        cursor: pointer;
    }

    .user-back {
        background: url(../assets/user.svg) no-repeat center;
        background-size: 100% 100%;
        border-color: white;
    }

    .add-back {
        background: url(../assets/add.svg) no-repeat center;
        background-size: 90% 90%;
    }

    .project-icon {
        margin: 5px;
        height: 28px;
        width: 40px;
    }

    .project-name {
        margin-top: 10px;
        font-size: 23px;
        color: white;
        cursor: default;
    }

    .lobby-list {
        overflow: auto;
        overflow-x: hidden;
        height: 100%;
        width: 100%;
    }

    .lobby-list::-webkit-scrollbar {
        width: 3px;
        background-color: rgba(162, 226, 226, 0);
    }

    .lobby-list::-webkit-scrollbar-thumb {
        border-radius: 5px;
        background-color: #727272;
    }

    .signin-onhover-back:hover {

    }

    .signout-onhover-back:hover {
        background-image: url(../assets/logout.svg);
        border-color: transparent;
    }
</style>