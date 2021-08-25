// Copyright (C) 2018 Patrick Maué
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
import moment from 'moment';
import { types } from 'util';

/**
 * Utility Methods for the vscode-journal extension
 */












export function getNextLine(content: string): string[] {

    let res: string[] = ["", ""];

    let pos: number = content.indexOf('\n');
    if (pos > 0) {
        res[0] = content.slice(0, pos);
        res[1] = content.slice(pos + 1, content.length);
    } else {
        res[0] = content;
    }
    return res;
}

export function isNullOrUndefined(value: any | undefined | null): boolean {
    return value === null || value === undefined;
}


export function isNotNullOrUndefined(value: any | undefined | null): boolean {
    return value !== null && value !== undefined;
}

export function isError(object: any | Error | undefined ): boolean {
    return isNotNullOrUndefined(object) && types.isNativeError(object);
}