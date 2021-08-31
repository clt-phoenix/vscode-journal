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

import { JournalPageType } from ".";


export interface TemplateInfo {
    template: string; 
    after: string; 
}


/*export interface InlineTemplate {
    scope: string; 
    id: string;
    template: string;
    after: string;
}*/


export interface ScopedTemplate {
    name?: string;
    scope?: string;
    template: string;
    value?: string;
}



export interface FilePattern extends ScopedTemplate {
    type: JournalPageType;
}

export interface PathTemplate extends ScopedTemplate {
    type: JournalPageType;
}

export interface HeaderTemplate extends ScopedTemplate {
}

export interface InlineTemplate extends ScopedTemplate {
    after: string;
}

