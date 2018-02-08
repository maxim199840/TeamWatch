<template>
    <div id="app">
        <header class=dashboard>
            <img class="project-icon" src="../assets/video-camera.svg"/>
            <p class="project-name">Team Watch</p>
            <template v-if="!user">
                <button class="right-bar user-btn user-img" @click="signIn"></button>
            </template>
            <template v-else>
                <div class="right-bar">
                    <button class="user-btn add-btn" @click="create" title="Create new lobby."></button>
                    <button class="user-btn user-img logout-btn"
                            :style="user.photo ? { 'background-image': 'url(' + user.photo +')'}:''"
                            @click="signOut" title="Sign out"></button>

                </div>
            </template>
        </header>
        <div class="lobby-list">
            <div class="lobby-list-item" v-for="lobby in sortedLobbies" :key="lobby.id">
                <span class="lobby-name">{{lobby.name}}</span>
                <button class="btn copy-back" style="margin-left: auto" @click="copyLink(lobby.id)" title="Copy link to lobby"></button>
                <template v-if="!lobby.isConnected">
                    <button class="btn connect-btn" @click="connect(lobby.id)" title="Connect to lobby"></button>
                    <button class="btn remove-btn" @click="remove(lobby.id)" title="Remove lobby"></button>
                </template>
                <template v-else>
                    <button v-if="!lobby.isSynced" class="btn sync-btn" @click="sync(lobby.id)" title="Sync video with lobby"></button>
                    <button v-else class="btn unsync-btn" @click="unsync(lobby.id)" title="Unsync video"></button>
                    <button class="btn disconnect-btn" @click="disconnect(lobby.id)" title="Disconnect from lobby"></button>
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
    header {
        margin-top: 2px;
        background-color: #2c3e50;
        height: 40px;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.19);
    }

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
        flex-direction: row;
    }

    .lobby-list-item {
        display: flex;
        width: 100%;
        height: 40px;
        flex-direction: row;
        align-items: center;
        border-bottom: 1px solid #ebebeb;
    }

    .lobby-list-item:hover {
        background: #f6f6f6;
        box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.18), 0 0 6px 4px rgba(0, 0, 0, 0.17);
        margin: 0 1px;
    }

    .lobby-name {
        overflow: hidden;
        margin: 5px 9px 5px;
        font-size: unset;
        width: 120px;
        height: 26px;
        text-overflow: ellipsis;
    }

    .btn {
        flex-shrink: 1;
        height: 26px;
        margin: 0 7px 0 0;
        border: 0;
        background: #ddd;
        border-radius: 4px;
    }

    .green-back {
        background-color: #8e9;
    }

    .red-back {
        background-color: #e98;
    }

    .blue-back {
        background-color: #9ce;
    }

    .copy-back {
        width: 26px;
        background: url(../assets/share.svg) no-repeat center;
        background-size: 22px 22px;
    }

    .right-bar {
        position: absolute;
        right: 7px;
        top: 8px;
    }

    .user-btn {
        border-radius: 50%;
        height: 26px;
        width: 26px;
        border: 0;
    }

    .user-img {
        background: center url("../assets/user.svg");
        background-size: 26px 26px;
        border: 2px solid white;
    }

    .add-btn {
        margin-top: 1px;
        border: 2px solid transparent;
        background: center url('../assets/add.svg');
        background-color: transparent;
        background-size: 22px 22px;
        background-repeat: no-repeat;
        margin-right: 5px;
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
    }

    .lobby-list {
        overflow: auto;
        overflow-x:hidden;
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

    .logout-btn:hover {
        background: url(../assets/logout.svg) no-repeat center;
        background-size: 22px 22px;
    }

    .sync-btn {
        width: 26px;
        height: 26px;
        background: url(../assets/synchronization.svg) no-repeat center;
        background-size: 20px 20px;
    }

    .unsync-btn {
        width: 26px;
        height: 26px;
        background: url(../assets/turn-synchronization-off.svg) no-repeat center;
        background-size: 20px 20px;
    }

    .disconnect-btn {
        width: 26px;
        height: 26px;
        background: url(../assets/disconnect.svg) no-repeat center;
        background-size: 22px 22px;
    }

    .remove-btn {
        width: 26px;
        height: 26px;
        background: url(../assets/trash-can-with-cover.svg) no-repeat center;
        background-size: 20px 20px;
    }

    .remove-btn:hover{
        background: url(../assets/open-trash-can.svg) no-repeat center;
        background-size: 22px 22px;
    }

    .connect-btn {
        width: 26px;
        height: 26px;
        background: url(../assets/enter-arrow.svg) no-repeat center;
        background-size: 22px 22px;
    }
</style>