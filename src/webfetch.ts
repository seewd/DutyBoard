import { fetch } from '@tauri-apps/plugin-http';

export type DutyRoomData = {
    room: string;
    groups: string[][][];
};

export async function fetchDutyData(): Promise<DutyRoomData[]> {
    type DutyDataResponse = {
        version: string,
        data: { id: string, name: string, index: number, rowCount: number, colCount: number, table: string[][] }[]
    };
    const resp = await fetch("https://www.yuque.com/api/v2/repos/gewu/iteam/docs/dutyboard_group", {
        method: 'GET',
        headers: { "X-Auth-Token": "JUS2GyMzm7AY8HcmnKn5WjkFO5g4n7cxWxcSLZzf" }
    });
    if (resp.status !== 200) throw new Error(`fetch failed ${resp.status} ${resp.statusText}`);

    const json = await resp.json() as { "data": { "body_sheet": string, "updated_at": string } };
    const data = JSON.parse(json.data.body_sheet) as DutyDataResponse;

    const res: {
        room: string;
        groups: string[][][];
    }[] = data.data
        .map(group => ({
            room: group.name,
            groups: group.table
                .slice(1)  // 去首行
                .map(row => row
                    .slice(1)  // 去首列
                    .map(cell => cell.trim())
                    .filter(cell => cell !== ""))
                .map(row => {
                    const newrow = [];
                    for (let i = 0; i < row.length; i += 2)
                        if (row[i] && row[i + 1]) newrow.push([row[i], row[i + 1]]);
                    return newrow;
                })
        }));
    return res;
}