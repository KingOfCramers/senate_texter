module.exports = {
    escaper: (s) => {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },
}