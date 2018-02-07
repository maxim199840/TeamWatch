<template>
    <div id="app">
        <header class=dashboard>
            <img class="project-icon" src="../assets/video-camera.svg"/>
            <span class="project-name">Team Watch</span>
            <template v-if="!user">
                <button class="right-bar user-btn user-img" @click="signIn"></button>
            </template>
            <template v-else>
                <div class="right-bar">
                    <button class="user-btn add-btn" @click="create" title="Create new lobby."></button>
                    <button class="user-btn user-img"
                            :style="user.photo ? { 'background-image': 'url(' + user.photo +')'}:''"
                            @click="signOut" title="Sign out"></button>

                </div>
            </template>
        </header>

        <div class="lobby-item" v-for="lobby in sortedLobbies" :key="lobby.id">
            {{lobby.name}}
            <button class="btn" id="copy-link" @click="copyLink(lobby.id)">Copy link</button>
            <template v-if="!lobby.isConnected">
                <button class="btn green" @click="connect(lobby.id)">Connect</button>
                <button class="btn red" @click="remove(lobby.id)">Remove</button>
            </template>
            <template v-else>
                <template v-if="!lobby.isSynced">
                    <button class="btn blue" @click="sync(lobby.id)">Sync</button>
                </template>
                <template v-else>
                    <button class="btn blue" @click="unsync(lobby.id)">Unsync</button>
                </template>
                <button class="btn red" @click="disconnect(lobby.id)">Disconnect</button>
            </template>
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
      };
    },
    computed: {
      sortedLobbies() {
        return Object.entries(this.lobbiesHistory).
            map(([id, details]) =>
                Object.assign({}, details, {id, isConnected: !!details.videoIdentity, isSynced: !!details.sync})).
            sort((lobby1, lobby2) => {
              if (lobby2.isConnected - lobby1.isConnected !== 0)
                return lobby2.isConnected - lobby1.isConnected;
              if (lobby1.isConnected && (lobby2.isSynced - lobby1.isSynced) !== 0)
                return lobby2.isSynced - lobby1.isSynced;
              return lobby1.name.localeCompare(lobby2.name);
            });
      },
    },
    mounted() {
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
      create(name) {
        name = `Lobby #${Math.floor(Math.random() * 999)}`;
        browser.tabs.query({active: true, currentWindow: true}, tabs => {
          browser.tabs.sendMessage(
              tabs[0].id,
              {
                type: CREATE_LOBBY,
                payload: {name},
              },
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
        browser.tabs.query({active: true, currentWindow: true}, tabs => {
          browser.tabs.sendMessage(
              tabs[0].id,
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
        background-color: #12425a;
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

    .btn {
        height: 26px;
        margin: 7px;
        border: 0;
        background: #ddd;
        opacity: 1;
    }

    .btn:hover {
        opacity: 0.7;
    }

    .green {
        background: #8e8;
    }

    .red {
        background: #f99;
    }

    .blue {
        background: #acf;
    }

    .lobby-item {
        width: 100%;
        height: 40px;
        padding: 0 10px;
        /*border: solid lightgray;*/
        /*border-width: 1px 0 0;*/
    }

    .lobby-item:hover {
        background: #f4f4f4;
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
</style>