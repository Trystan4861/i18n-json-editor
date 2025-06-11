export interface EIJEView {
    type: EIJEViewType;
    selectionId?: number;
}
export enum EIJEViewType {
    TABLE = 'table',
    LIST = 'list'
}