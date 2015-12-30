export function stringEndsWith(subjectString: string, searchString: string, position: number = subjectString.length) {
    position -= searchString.length;

    var lastIndex = subjectString.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
};
