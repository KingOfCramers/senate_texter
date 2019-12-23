module.exports = {
    replacer: (value) => {
        console.log(value)
        return value.replace(/[^\w\s]/gi, '')
    },
    escaper: (s) => {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },
}