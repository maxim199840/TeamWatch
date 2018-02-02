<template>
    <div>
        <button @click="$emit('logout')">Logout</button>
        <div>
            <button @click="$emit('create-lobby')">
                Create lobby
            </button>
        </div>
        <div v-for="lobby in sortedComputedLobbiesHistoryArray" :key="lobby.id">
            <template v-if="!lobby.isConnected">
                {{lobby.name}}
                <button @click="$emit('connect',lobby.id)">Connect</button>
                <button @click="$emit('remove',lobby.id)">Remove</button>
            </template>
            <template v-else>
                {{lobby.name}}
                <template v-if="!lobby.isSynced">
                    <button @click="$emit('sync',lobby.id)">Sync</button>
                </template>
                <template v-else>
                    <button @click="$emit('unsync',lobby.id)">Unsync</button>
                </template>
                <button @click="$emit('disconnect',lobby.id)">Disconnect</button>
            </template>
        </div>
    </div>
</template>

<script>
  export default {
    name: 'overview',
    props: ['lobbiesHistory'],
    computed: {
      sortedComputedLobbiesHistoryArray() {
        return Object.entries(this.lobbiesHistory).
            map(([id, details]) =>
                Object.assign({}, details, {id, isConnected: !!details.videoIdentity, isSynced: !!details.sync})).
            sort((lobby1, lobby2) => {
              let compareResult = lobby2.isConnected - lobby1.isConnected;
              if (compareResult !== 0) return compareResult;
              if (lobby1.isConnected) {
                compareResult = lobby2.isSynced - lobby1.isSynced;
                if (compareResult !== 0) return compareResult;
              }
              return lobby1.name.localeCompare(lobby2.name);
            });
      },
    },
  };
</script>