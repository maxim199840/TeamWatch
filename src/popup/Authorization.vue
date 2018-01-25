<template>
    <div>
        <label>
            User id:
            <input type="text" v-model="userId"/>
        </label>
        <br>
        <button @click="$emit('login',userId)">Login</button>
    </div>
</template>

<script>
  export default {
    name: 'authorization',
    data() {
      return {
        userId: null,
      };
    },
  };
</script>