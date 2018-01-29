<template>
    <div>
        <label>
            User id:
            <input type="text" v-model="userId"/>
        </label>
        <br>
        <button @click="loginClick">Login</button>
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
    methods: {
      loginClick({target: {value}}) {
        this.$emit('login', {userId: value});
      },
    },
  };
</script>