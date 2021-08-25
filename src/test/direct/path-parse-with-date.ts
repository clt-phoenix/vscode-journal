import moment from "moment";

console.log("Starting test to aquire date from uri"); 

const regExpDateFormats: RegExp = new RegExp(/\$\{(?:(year|month|day|localTime|localDate|weekday)|(d:[\s\S]+?))\}/g);

let pathTpl = "${base}/${year}-${month}"; 
let fileTpl = "${year}${month}${day}.${ext}"; 
let base = "c:\\Users\\pajom\\Git\\vscode-journal\\test\\workspace\\journal"
let uri = "c:\\Users\\pajom\\Git\\vscode-journal\\test\\workspace\\journal\\2021-08\\20210809.md";

getDateFromURI(uri, pathTpl, fileTpl, base)
.then(result => {
    console.log(result); 
}); 



export async function getDateFromURI(uri: string, pathTemplate: string, fileTemplate: string, basePath: string) {
    fileTemplate = fileTemplate.substr(0, fileTemplate.lastIndexOf(".")); 


    let year: number | undefined; 
    let month: number | undefined; 
    let day: number | undefined; 

    // input template is something like 
    //  "path": "${base}/${year}/${month}", -> sdlkjfwejf/2021/12
    //  "file": "${day}.${ext}"  -> 21.md
    //  but also file: ${year}-${month}-${day}.md


    // go through each element in path and assign it to a date part or skip it
    let pathParts = uri.split("/");


    // check if part is in base path (if yes, we ignore)
    // for the rest: last part is file, everything else path pattern
    let pathElements: string[] = []
    let pathStr: string = ""; 
    let fileStr = ""; 

    pathParts.forEach((element, index) => {
        if(element.trim().length === 0) return; 
        else if(basePath.search(element) >= 0) return; 
        else if(index+1 == pathParts.length) fileStr = element.substr(0, element.lastIndexOf("."))
        else {
            pathElements.concat(element)
            pathStr += "/"+element; 
        }
    });


    console.log(pathStr); 
    console.log(fileStr); 

    // ${base}/${year}/${month}-${day}/${LD}.${ext}
    // remove base and ext variables
    // tokenize in variables and loop through matches. 
    // replace each match with momemnt format and call moment.parse

    // path: 2021-08
    // file: 2021-08-12.md

    // handle path segment (we just compare indicies)
    /*
    pathTpl.split("/").forEach((element, index) => {
        if(element.match("")
    })*/
    let mom: moment.Moment = moment(fileStr, fileTemplate); 

    const entryMomentTpl = replaceDateTemplatesWithMomentsFormats(fileTemplate); 
    const pathMomentTpl = replaceDateTemplatesWithMomentsFormats(pathTemplate); 

    // filestr: "20210809"
    // path str: "/202108"
    // path tpl: ${year}-${month}"

    let a = moment(fileStr, entryMomentTpl); 
    let b = moment(pathStr, pathMomentTpl); 
    

    return new Date(); 

}



export function replaceDateTemplatesWithMomentsFormats(template: string): string {
    let matches: RegExpMatchArray = template.match(regExpDateFormats) || [];
    matches.forEach(match => {
        switch (match) {
            case "${year}":
                template = template.replace(match, "YYYY"); break;
            case "${month}":
                template = template.replace(match, "MM"); break;
            case "${day}":
                template = template.replace(match, "DD"); break;
            case "${localTime}":
                template = template.replace(match, "LT"); break;
            case "${localDate}":
                template = template.replace(match, "LL"); break;
            case "${weekday}":
                template = template.replace(match, "dddd"); break;
            default:
                // check if custom format
                if (match.startsWith("${d:")) {

                    let modifier = match.substring(match.indexOf("d:") + 2, match.length - 1); // includes } at the end
                    // st.template = st.template.replace(match, mom.format(modifier));
                    // fix for #51
                    template = template.replace(match, modifier);
                    break;
                }
                break;
        }
    });
    return template;

}