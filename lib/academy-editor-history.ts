// Local editing history contains editable fields only, never server revisions.
type Draft = {id: string; title: string; status: string; body: any; [key: string]: any};
type Snapshot = Pick<Draft, 'title' | 'status' | 'body'>;
export type EditorHistory = {form: Draft; past: Snapshot[]; future: Snapshot[]};
export type EditorAction = {type: 'edit' | 'accept' | 'reset'; form: Draft} | {type: 'undo' | 'redo'};
const snapshot = ({title, status, body}: Draft): Snapshot => ({title, status, body});
export const initialEditorHistory = (form: Draft): EditorHistory => ({form, past: [], future: []});
export function editorHistory(state: EditorHistory, action: EditorAction): EditorHistory {
  if (action.type === 'reset') return initialEditorHistory(action.form);
  if (action.type === 'accept') {
    if (action.form.id !== state.form.id) return initialEditorHistory(action.form);
    return {...state, form: action.form};
  }
  if (action.type === 'edit') {
    if (JSON.stringify(snapshot(state.form)) === JSON.stringify(snapshot(action.form))) return state;
    return {form: action.form, past: [...state.past, snapshot(state.form)].slice(-50), future: []};
  }
  const from = action.type === 'undo' ? state.past : state.future;
  if (!from.length) return state;
  const form = {...state.form, ...from[from.length - 1]};
  return action.type === 'undo'
    ? {form, past: state.past.slice(0, -1), future: [...state.future, snapshot(state.form)].slice(-50)}
    : {form, past: [...state.past, snapshot(state.form)].slice(-50), future: state.future.slice(0, -1)};
}
