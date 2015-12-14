module.exports = {
    pr: function(str) {
        console.log(str.bgYellow);
        return str;
    },
    pro: function(ob) {
        console.log(JSON.stringify(ob,null,4).bgYellow);
        return ob;
    }
}

