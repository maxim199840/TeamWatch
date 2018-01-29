<template>
    <div>
        <button @click="$emit('logout')">Logout</button>
        <div v-for="(lobbyDetails,lobbyId) in lobbiesHistory">
            <h3>
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
  };
</script>