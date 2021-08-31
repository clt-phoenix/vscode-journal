// Copyright (C) 2018  Patrick Maué
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

import * as fs from 'fs';
import * as Path from 'path';
import * as Q from 'q';
import * as vscode from 'vscode';
import * as J from '../';

export interface FileEntry {
    path: string;
    name: string;
    scope: string;
    update_at: number;
    created_at: number;
    type: J.Model.JournalPageType;
}

export interface BaseDirectory {
    path: string;
    scope: string;
}

/** 
 * Anything which scans the files in the background goes here
 * 
 */

export class Reader {
    constructor(public ctrl: J.Util.Ctrl) {
    }

    //private previousEntries: Array<FileEntry> = [];


    /**
     * Loads previous entries. This method is async and is called in combination with the sync method (which uses the threshold)
     * 
     * Update: ignore threshold
     *
     * @returns {Q.Promise<[string]>}
     * @memberof Reader
     */
    public async getPreviouslyAccessedFiles(thresholdInMs: number, callback: Function, picker: any, type: J.Model.JournalPageType, directories: BaseDirectory[]): Promise<void> {

        // go into base directory, find all files changed within the last 40 days
        // for each file, check if it is an entry, a note or an attachement
        this.ctrl.logger.trace("Entering getPreviousJournalFiles() in actions/reader.ts and directory: " + directories);
        directories.forEach(directory => {
            this.walkDir(directory.path, thresholdInMs, async (entry: FileEntry) => {

                entry.type = await J.Util.inferType(Path.parse(entry.path), this.ctrl.config.getFileExtension());
                entry.scope = directory.scope;
                // this adds the item to the quickpick list of vscode (the addItem Function)
                callback(entry, picker, type);

            });
        });
    }

    /**
     * Loads previous entries which have been edited within the last x days (x = threshold in milliseconds)
     * 
     * @param thresholdInMs 
     * @param directories 
     * @returns 
     */
    public async getPreviouslyAccessedFilesSync(thresholdInMs: number, directories: BaseDirectory[]): Promise<FileEntry[]> {

        this.ctrl.logger.trace("Entering getPreviousJournalFilesSync() in actions/reader.ts");

        let result: FileEntry[] = [];

        // go into base directory, find all files changed within the last 40 days (see config)
        // for each file, check if it is an entry, a note or an attachement
        directories.forEach(directory => {
            this.walkDirSync(directory.path, thresholdInMs, async (entry: FileEntry) => {
                /*if (this.previousEntries.findIndex(e => e.path.startsWith(entry.path)) == -1) {
                    this.inferType(entry);
                    //  this.previousEntries.push(entry);
                }*/
                entry.type = await J.Util.inferType(Path.parse(entry.path), this.ctrl.config.getFileExtension());
                entry.scope = directory.scope;
                result.push(entry);
            });
        });
        return result; 

    }


    /**
     * Scans journal directory and scans for notes
     * 
     * Update: Removed age threshold, take everything
     * Update: switched to async with readdir
     * 
     * See https://medium.com/@allenhwkim/nodejs-walk-directory-f30a2d8f038f
     * @param dir 
     * @param callback 
     */
    private async walkDir(dir: string, thresholdInMs: number, callback: Function): Promise<void> {
        fs.readdir(dir, (err, files) => {
            // we ignore errors here

            files.forEach(f => {
                let dirPath = Path.join(dir, f);
                let stats: fs.Stats = fs.statSync(dirPath);

                if (stats.isDirectory()) {
                    this.walkDir(dirPath, thresholdInMs, callback);
                } else {
                    callback({
                        path: Path.join(dir, f),
                        name: f,
                        updated_at: stats.mtime,
                        accessed_at: stats.atime,
                        created_at: stats.birthtime
                    });
                }
            });
        });
    }

    private async walkDirSync(dir: string, thresholdDateInMs: number, callback: Function): Promise<void> {
        fs.readdirSync(dir).forEach(f => {
            if (f.startsWith(".")) { return; }

            let dirPath = Path.join(dir, f);
            let stats: fs.Stats = fs.statSync(dirPath);

            // if last access time after threshold and item is directory
            if ((stats.atimeMs > thresholdDateInMs) && (stats.isDirectory())) {
                this.walkDirSync(dirPath, thresholdDateInMs, callback);

                // if modified time after threshold and item is file
            } else if (stats.mtimeMs > thresholdDateInMs) {

                callback({
                    path: Path.join(dir, f),
                    name: f,
                    updated_at: stats.mtimeMs,
                    accessed_at: stats.atimeMs,
                    created_at: stats.birthtimeMs

                });
            };
        });
    }

    private async checkDirectory(d: Date, entries: string[]): Promise<void> {
        await this.ctrl.config.getNotesPathPattern(d)
            .then(f => {
                return f.value!;
            }).then(path => {
                fs.readdir(path, (err, files: string[]) => {
                    if (err) { return; }
                    else {

                        files.forEach(file => {
                            if (!entries.find(p => file.startsWith(p))) {
                                entries.push(file);
                            }
                        });
                    }
                });
            });
    }

    /**
     *  Returns a list of all local files referenced in the given document. 
     *
     * @param {vscode.TextDocument} doc the current journal entry 
     * @returns {Promise<string[]>} an array with all references in  the current journal page
     * @memberof Reader
     */
    public async getReferencedFiles(doc: vscode.TextDocument): Promise<vscode.Uri[]> {
        this.ctrl.logger.trace("Entering getReferencedFiles() in actions/reader.ts for document: ", doc.fileName);

        return Q.Promise<vscode.Uri[]>((resolve, reject) => {
            try {
                let references: vscode.Uri[] = [];
                let regexp: RegExp = new RegExp(/\[.*\]\((.*)\)/, 'g');
                let match: RegExpExecArray | null;

                while (match = regexp.exec(doc.getText())) {
                    let loc = match![1];

                    // parse to path to resolve relative paths (starting with ./)
                    let dirToEntry: string = Path.parse(doc.uri.fsPath).dir; // resolve assumes directories, not files
                    let absolutePath: string = Path.resolve(dirToEntry, loc);

                    references.push(vscode.Uri.file(absolutePath));
                }

                this.ctrl.logger.trace("getReferencedFiles() - Referenced files in document: ", references.length);
                resolve(references);
            } catch (error) {
                this.ctrl.logger.trace("getReferencedFiles() - Failed to find references in journal entry with path ", doc.fileName);
                reject(error);
            }
        });

    }

    public async getFilesInNotesFolderAllScopes(doc: vscode.TextDocument, date: Date): Promise<vscode.Uri[]> {
        return Q.Promise<vscode.Uri[]>((resolve, reject) => {

            // scan attachement folders for each scope
            let promises: Q.Promise<vscode.Uri[]>[] = [];
            this.ctrl.configuration.getScopes().forEach(scope => {
                let promise: Q.Promise<vscode.Uri[]> = this.getFilesInNotesFolder(doc, date, scope);
                promises.push(promise);
            });

            // map to consolidated list of uris

            Q.all(promises)
                .then((uriArrays: vscode.Uri[][]) => {
                    let locations: vscode.Uri[] = [];
                    uriArrays.forEach(uriArray => {
                        uriArray.forEach(uri => {
                            // scopes might also point to the default location, which results in duplicate entries    
                            if (!locations.find(elem => elem.path === uri.path)) {
                                locations.push(uri);
                            }
                        });
                    });
                    return locations;
                })
                .then(resolve)
                .catch(reject);
        });

    }


    /**
     * Returns a list of files sitting in the notes folder for the current document (has to be a journal page)
     *
     * @param {vscode.TextDocument} doc the current journal entry 
     * @returns {Q.Promise<ParsedPath[]>} an array with all files sitting in the directory associated with the current journal page
     * @memberof Reader
     */
    public getFilesInNotesFolder(doc: vscode.TextDocument, date: Date, scope: string): Q.Promise<vscode.Uri[]> {

        this.ctrl.logger.trace("Entering getFilesInNotesFolder() in actions/reader.ts for document:", doc.fileName, "and scope", scope);

        return Q.Promise<vscode.Uri[]>((resolve, reject) => {

            try {
                let filePattern: string;

                // FIXME: scan note foldes of new configurations
                this.ctrl.configuration.getNotesFilePattern(date, scope)
                    .then((_filePattern: J.Model.ScopedTemplate) => {
                        filePattern = _filePattern.value!.substring(0, _filePattern.value!.lastIndexOf(".")); // exclude file extension, otherwise search does not work
                        return this.ctrl.configuration.getNotesPathPattern(date, scope);
                    })
                    .then((pathPattern: J.Model.ScopedTemplate) => {
                        pathPattern.value = Path.normalize(pathPattern.value!);

                        // check if directory exists
                        fs.access(pathPattern.value!, (err: NodeJS.ErrnoException | null) => {
                            if (J.Util.isNullOrUndefined(err)) {
                                // list all files in directory and put into array
                                fs.readdir(pathPattern.value!, (err: NodeJS.ErrnoException | null, files: string[]) => {
                                    try {
                                        if (J.Util.isNotNullOrUndefined(err)) { reject(err!.message); }
                                        this.ctrl.logger.debug("Found ", files.length + "", " files in notes folder at path: ", JSON.stringify(pathPattern.value!));

                                        let result = files.filter((name: string) => {
                                            // filter, check if no temporary files are included
                                            return (!name.startsWith("~") || !name.startsWith("."));
                                        })
                                            .map((name: string) => {
                                                return vscode.Uri.file(Path.normalize(pathPattern.value! + Path.sep + name));
                                            });

                                        resolve(result);
                                    } catch (error) {
                                        reject(error);
                                    }

                                });
                            } else {
                                resolve([]);
                            }

                        });


                    });

                /*
            // get base directory of file
            let p: string = doc.uri.fsPath;
    
            // get filename, strip extension, set as notes getFilesInNotesFolder
            p = p.substring(0, p.lastIndexOf("."));
    
    */


            } catch (error) {
                this.ctrl.logger.error(error);
                reject("Failed to scan files in notes folder");
            }
        });
    }









    /**
     * Creates or loads a note 
     *
     * @param {string} path
     * @param {string} content
     * @returns {Q.Promise<vscode.TextDocument>}
     * @memberof Writer
     */
    public async loadNote(path: string, content: string): Promise<vscode.TextDocument> {
        this.ctrl.logger.trace("Entering loadNote() in  actions/reader.ts for path: ", path);

        // TODO: Check if file exists, if not prefix with "untitled:"
        try {
            const doc: vscode.TextDocument = await this.ctrl.ui.openDocument(path);
            return doc;
        } catch (error) {

            this.ctrl.logger.error("Error in loadNote() in  actions/reader.ts for path: ", path, "Reason: ", error);
            throw error;
        }
        /*
        return Q.Promise<vscode.TextDocument>((resolve, reject) => {
            // check if file exists already

            this.ctrl.ui.openDocument(path)
                .then((doc: vscode.TextDocument) => resolve(doc))
                .catch(error => {
                    this.ctrl.writer.createSaveLoadTextDocument(path, content)
                        .then((doc: vscode.TextDocument) => resolve(doc))
                        .catch(error => {
                            this.ctrl.logger.error(error);
                            reject("Failed to load note.");
                        });
                })
                .done();

        }); */
    }

    /**
  * Returns the page for a day with the given input. If the page doesn't exist yet, 
  * it will be created (with the current date as header) 
  *
  * @param {input} input with offset 0 is today, -1 is yesterday
  * @returns {Q.Promise<vscode.TextDocument>} the document
  * @memberof Reader
  */
    public async loadEntryForInput(input: J.Model.Input): Promise<vscode.TextDocument> {
        if (J.Util.isNullOrUndefined(input.offset)) {
            throw Error("Not a valid value for offset");
        }
        this.ctrl.logger.trace("Entering loadEntryForInput() in actions/reader.ts and offset " + input.offset);
        return this.ctrl.reader.loadEntryForDate(input.generateDate());

    }



    /**
     * Converts given path and filename into a full path. 
     * @param pathname 
     * @param filename 
     */
    private resolvePath(pathname: string, filename: string): string {

        return Path.resolve(pathname, filename);

    }


    /**
     * Loads the journal entry for the given date. If no entry exists, promise is rejected with the invalid path
     *
     * @param {Date} date the date for the entry
     * @returns {Q.Promise<vscode.TextDocument>} the document
     * @throws {string} error message
     * @memberof Reader
     */
    public async loadEntryForDate(date: Date): Promise<vscode.TextDocument> {

        return Q.Promise<vscode.TextDocument>((resolve, reject) => {
            if (J.Util.isNullOrUndefined(date) || date!.toString().includes("Invalid")) {
                reject("Invalid date");
                return;
            }

            this.ctrl.logger.trace("Entering loadEntryforDate() in actions/reader.ts for date " + date.toISOString());

            let path: string = "";

            Promise.all([
                this.ctrl.config.getEntryPathPattern(date),
                this.ctrl.config.getEntryFilePattern(date)

            ]).then(([pathname, filename]) => {
                path = this.resolvePath(pathname.value!, filename.value!);
                return this.ctrl.ui.openDocument(path);

            }).catch((error: Error) => {
                if (!error.message.startsWith("cannot open file:")) {
                    this.ctrl.logger.printError(error);
                    reject(error);
                }
                return this.ctrl.writer.createEntryForPath(path, date);

            }).then((_doc: vscode.TextDocument) => {
                this.ctrl.logger.debug("loadEntryForDate() - Loaded file in:", _doc.uri.toString());
                this.ctrl.inject.injectAttachementLinks(_doc, date);
                resolve(_doc);

            }).catch((error: Error) => {
                this.ctrl.logger.printError(error);
                reject("Failed to load entry for date: " + date.toDateString());

            });



            /*
            J.Util.getEntryPathForDate(date, this.ctrl.config.getBasePath(), this.ctrl.config.getFileExtension())
                .then((_path: string) => {
                    path = _path;
                    return this.ctrl.ui.openDocument(path);
                })
                .catch((error: Error) => {
                    return this.ctrl.writer.createEntryForPath(path, date);
                })
                .then((_doc: vscode.TextDocument) => {
                    this.ctrl.logger.debug("Loaded file:", _doc.uri.toString());
    
                    return this.ctrl.inject.synchronizeReferencedFiles(_doc);
                })
                .then((_doc: vscode.TextDocument) => {
                    resolve(_doc);
                })
    
                .catch((error: Error) => {
                    this.ctrl.logger.error(error);
                    reject("Failed to load entry for date: " + date.toDateString());
                })
                .done();
                */

        });
    }

}


