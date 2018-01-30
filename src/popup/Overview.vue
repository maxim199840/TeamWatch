<template>
    <div>
        <button @click="$emit('logout')">Logout</button>
        <div v-for="(lobbyDetails,lobbyId) in lobbiesHistory">
            <h3 v-if="isLobbyConnected(lobbyId)">
                {{lobbyDetails.name}}
                <button v-if="!isLobbySync(lobbyId)" @click="$emit('sync',lobbyId)">
                    Sync
                </button>
                <button v-else @click="$emit('unsync',lobbyId)">
                    Unsync
                </button>
                <button @click="$emit('disconnect',lobbyId)">
                    Disconnect
                </button>
            </h3>
            <h3 v-else>
                {{lobbyDetails.name}}
                <button @click="$emit('connect',lobbyId)">Connect</button>
            </h3>
        </div>
    </div>
</template>

<script>
  export default {
    name: 'overview',
    props: ['lobbiesHistory'],
    methods: {
      isLobbyConnected(lobbyId) {
        return !!this.lobbiesHistory[lobbyId].videoIdentity;
      },
      isLobbySync(lobbyId) {
        return !!this.lobbiesHistory[lobbyId].sync;
      },
    },
  };
</script>