const singleton = (() => {
    let reference;
    const initSingleton = () => {
        const utc_regexp = RegExp(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/);
        const checkUTC = (str) => utc_regexp.test(str);
        return {
            utc: (str) => checkUTC(str),
        };
    };
    return {
        init: () => {
            if (reference) return reference;
            reference = initSingleton();
            return reference;
        },
    };
})();

exports.check = singleton.init();
