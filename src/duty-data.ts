import dayjs from 'dayjs';
import businessDays from 'dayjs-business-days2';
import { fetchDutyData, type DutyRoomData as RoomData } from './webfetch';
import { getDutyData as getStoredDutyData, setDutyData } from './store';
dayjs.extend(businessDays);

interface DutyConfig {
    groups: { [key: string]: string[] }[];
    day1: dayjs.Dayjs;
}

export interface DutyInfo {
    group: { [key: string]: string[] } | null;
    groupIdx: number | null;
}

export function getDutyInfo(date: dayjs.Dayjs, conf: DutyConfig): DutyInfo {
    const dow = date.day();
    const diff = date.businessDiff(conf.day1);
    const groupIdx = diff % conf.groups.length;
    console.log(dow, diff, groupIdx, conf.groups[groupIdx]);
    return (dow !== 0 && dow !== 6) ? {
        groupIdx,
        group: conf.groups[groupIdx]
    } : { groupIdx: null, group: null };
};

/** API->groups */
export function roomDataToGroups(room: RoomData): { [room: string]: string[] }[] {
    return room.groups.map(g => ({
        [room.room]: g.map(p => p[0])
    }));
}

/** 运行时内存缓存 */
let RoomsData: RoomData[] | null = null;
let _currentRoomGroups: { [room: string]: string[] }[] | null = null;

/** 拉取网络数据，成功则写入 store；失败则从 store 读取兜底 */
async function loadDutyData(): Promise<RoomData[]> {
    try {
        const data = await fetchDutyData();
        setDutyData(data); // 静默持久化
        return data;
    } catch (e) {
        console.warn("fetch duty data failed, loading from store", e);
        const stored = await getStoredDutyData();
        if (stored) return stored;
        throw e; // store 也没有，只能抛错
    }
}

export async function getDutyDataByRoom(roomName: string): Promise<{ [room: string]: string[] }[]> {
    RoomsData = await loadDutyData();
    const room = RoomsData.find(r => r.room === roomName);
    if (!room) throw new Error(`${roomName} not found`);
    _currentRoomGroups = roomDataToGroups(room);
    return _currentRoomGroups;
}

export const getAllRoomsData = () => RoomsData ? RoomsData.map(r => r.room) : [];
export const getCurrentGroups = () => _currentRoomGroups ?? [];

const _HIDDEN_PERIOD_A = [
    { start: [7, 50], end: [8, 30] },
    { start: [8, 40], end: [9, 20] },
    { start: [9, 50], end: [10, 30] },
    { start: [10, 40], end: [11, 20] },
    { start: [11, 30], end: [12, 10] },
    { start: [13, 40], end: [14, 20] },
    { start: [14, 30], end: [15, 10] },
    { start: [15, 30], end: [16, 10] },
    { start: [16, 20], end: [17, 0] },
];
const _HIDDEN_PERIOD_BCDE = [
    { start: [8, 0], end: [8, 40] },
    { start: [8, 50], end: [9, 30] },
    { start: [9, 50], end: [10, 30] },
    { start: [10, 40], end: [11, 20] },
    { start: [11, 30], end: [12, 10] },
    { start: [13, 40], end: [14, 20] },
    { start: [14, 30], end: [15, 10] },
    { start: [15, 30], end: [16, 10] },
    { start: [16, 20], end: [17, 0] },
];
export const HIDDEN_PERIODS = {
    "A": _HIDDEN_PERIOD_A,
    "B": _HIDDEN_PERIOD_BCDE,
    "C": _HIDDEN_PERIOD_BCDE,
    "D": _HIDDEN_PERIOD_BCDE,
    "E": _HIDDEN_PERIOD_BCDE,
} as const;

export type HourNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
export type MinuteNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
    | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
    | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44
    | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59;

export interface ScrnConfig {
    hiddenPeriods: typeof HIDDEN_PERIODS;
}
export function isInHiddenPeriod(h: HourNum, m: MinuteNum, conf: ScrnConfig): boolean {
    const t = h * 60 + m;
    let periods: typeof HIDDEN_PERIODS['A' | 'B' | 'C' | 'D' | 'E'];
    switch (dayjs().day()) {
        case 1: periods = conf.hiddenPeriods["A"]; break;
        case 2: periods = conf.hiddenPeriods["B"]; break;
        case 3: periods = conf.hiddenPeriods["C"]; break;
        case 4: periods = conf.hiddenPeriods["D"]; break;
        case 5: periods = conf.hiddenPeriods["E"]; break;
        default: return false; // 周末
    }
    return periods.some(p => t >= p.start[0] * 60 + p.start[1] &&
        t < p.end[0] * 60 + p.end[1]
    );
}
