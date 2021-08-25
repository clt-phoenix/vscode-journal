// Copyright (C) 2021 Patrick Maué
// 
// This file is part of vscode-journal.
// 
// vscode-journal is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// vscode-journal is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with vscode-journal.  If not, see <http://www.gnu.org/licenses/>.
// 

'use strict';

import * as Q from 'q';
import * as Path from 'path';
import * as fs from 'fs';
import * as J from '..';
import { getDayAsString, prefixZero } from './strings';
import { isNullOrUndefined } from './util';
import moment from 'moment';
import { replaceDateTemplatesWithMomentsFormats } from './dates';

/**
* Returns the path for a given date as string
* @deprecated
*/
export function getEntryPathForDate(date: Date, base: string, ext: string): Q.Promise<string> {

    return Q.Promise<string>((resolve, reject) => {
        try {
            let pathStr = Path.join(getPathOfMonth(date, base), getDayAsString(date) + "." + ext);
            let path: Path.ParsedPath = Path.parse(pathStr);
            resolve(Path.format(path));

        } catch (error) {
            reject(error);
        }
    });
}

export function getPathAsString(path: Path.ParsedPath): string {
    return Path.format(path);
}

/**
 * Tries to infer a date from a given path (taken from vscode.TextDocument)
 * 
 * This function expects only paths to valid journal entries, scoped entries are ignored
 * 
 * @param entryPath 
 */
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

/**
 * Tries to infer a date from a given path (taken from vscode.TextDocument)
 * 
 * This function expects only paths to valid journal entries, scoped entries are ignored
 * 
 * @param entryPath 
 */
export async function getDateFromURIAndConfig(entryPath: string,  configCtrl: J.Provider.Configuration): Promise<Date> {
    const pathTpl = (await configCtrl.getEntryPathPattern(new Date())).template; 
    const entryTpl = (await configCtrl.getEntryFilePattern(new Date())).template; 
    const base = (await configCtrl.getBasePath()); 

    return getDateFromURI(entryPath, pathTpl, entryTpl, base); 

}


/**
 * Returns the filename of a given URI. 
 * Example: "21" of uri "file://some/path/to/21.md"
 * 
 * @param uri 
 * @param withExtension 
 * @returns 
 */
 export function getFileInURI(uri: string, withExtension?: boolean): string {
    let p: string = uri.substr(uri.lastIndexOf("/") + 1, uri.length);
    if (withExtension === null || !withExtension) {
        return p.split(".")[0];
    } else {
        return p;
    }
}

/**
 * Returns path to month folder. 
 */
 export function getPathOfMonth(date: Date, base: string): string {
    let year = date.getFullYear().toString();
    let month = prefixZero(date.getMonth() + 1);
    return Path.resolve(base, year, month);
}

/**
* Returns target for notes as string; 
*/
// TODO: this has to be reimplemented, should consider the configuration of the path for notes in different scopes
export async function getFilePathInDateFolder(date: Date, filename: string, base: string, ext: string): Promise<string> {
    try {
        let pathStr = Path.resolve(getPathOfMonth(date, base), getDayAsString(date), filename + "." + ext);
        let path: Path.ParsedPath = Path.parse(pathStr);
        return Path.format(path);
    } catch (error) {
        throw error;
    }
}

/**
*  Check if config dir exists, otherwise copy defaults from extension directory
*  We can't Q's nfcall, since those nodejs operations don't have (err,data) responses
* 
*  fs.exists does only return "true", see https://github.com/petkaantonov/bluebird/issues/418
*  @param path 
*/
export async function checkIfFileIsAccessible(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.access(path, err => {
            if (isNullOrUndefined(err)) { resolve(); }
            else { reject((<NodeJS.ErrnoException>err).message); }
        })
    }); 
}