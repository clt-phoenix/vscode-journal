// Copyright (C) 2017  Patrick Maué
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


// export { JournalCompletionProvider, JournalActionsProvider } from './provider';    

import * as Commands from './commands'; 

export { Commands }

export { VSCode } from './vscode';
export { MigrateTasksCodeLens } from './codelens/migrate-tasks'
export { OpenTaskActions } from './codeactions/for-open-tasks'
export { CompletedTaskActions} from './codeactions/for-completed-tasks'
/*
export { ShiftTaskCommand } from './commands/shift-task'
export { OpenJournalWorkspaceCommand } from './commands/open-journal-workspace'
export { PrintTimeCommand } from './commands/print-current-time'
export { PrintDurationCommand } from './commands/print-duration-between-selected-times'
export { PrintSumCommand } from './commands/print-sum-of-selected-numbers'
export { ShowEntryForInputCommand } from './commands/show-entry-for-input'
export { ShowEntryForTodayCommand } from './commands/show-entry-for-today'
export { ShowEntryForTomorrowCommand } from './commands/show-entry-for-tomorrow'
export { ShowEntryForYesterdayCommand } from './commands/show-entry-for-yesterday'
export { ShowNoteCommand } from './commands/show-note'
export { InsertMemoCommand } from './commands/insert-memo'
*/
export {
    Configuration, 
    InlineTemplate, 
    ScopedTemplate, 
    HeaderTemplate, 
    SCOPE_DEFAULT
} from './conf';
