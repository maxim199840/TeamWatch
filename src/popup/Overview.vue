<template>
    <div>
        <div class="ui-section">
            <button class="btn" @click="$emit('create-lobby')">
                Create lobby
            </button>
            <button class="btn" @click="$emit('logout')">
                Logout
            </button>
        </div>
        <div class="lobby-item" v-for="lobby in sortedLobbies" :key="lobby.id">
            {{lobby.name}}
            <template v-if="!lobby.isConnected">
                <button class="btn connect-btn" @click="$emit('connect',lobby.id)">
                    Connect
                </button>
                <button class="btn remove-btn" @click="$emit('remove',lobby.id)">
                    Remove
                </button>
            </template>
            <template v-else>
                <template v-if="!lobby.isSynced">
                    <button class="btn sync-btn" @click="$emit('sync',lobby.id)">
                        Sync
                    </button>
                </template>
                <template v-else>
                    <button class="btn unsync-btn" @click="$emit('unsync',lobby.id)">
                        Unsync
                    </button>
                </template>
                <button class="btn disconnect-btn" @click="$emit('disconnect',lobby.id)">
                    Disconnect
                </button>
            </template>
        </div>
    </div>
</template>

<script>
  export default {
    name: 'overview',
    props: ['lobbiesHistory'],
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
  };
</script>

<style>
    .btn {
        height: 26px;
        margin: 7px;
        border: 0;
    }

    .connect-btn {
        background: #90e090;
    }

    .disconnect-btn {
        background: #e99;
    }

    .sync-btn {
        background: #acf;
    }

    .unsync-btn {
        background: #acf;
    }

    .remove-btn {
        background: #e99;
    }

    .ui-section {
        padding: 0 10px;
    }

    .lobby-item {
        width: 100%;
        height: 40px;
        padding: 0 10px;
        border: solid lightgray;
        border-width: 1px 0 0;
    }

    .lobby-item:hover {
        background: #f3f3f3;
    }
</style>