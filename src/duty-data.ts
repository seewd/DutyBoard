import dayjs from 'dayjs';
import businessDays from 'dayjs-business-days2';
dayjs.extend(businessDays);

export const DUTY_GROUPS = [
    { 'W401': ["朱辰"] },              // 第 1 周 周一
    { 'W401': ["郑泽涵"] },            // 第 1 周 周二
    { 'W401': ["赵嘉彤", "马瑞骐"] },  // 第 1 周 周三
    { 'W401': ["余卓霏", "魏思霖"] },  // 第 1 周 周四
    { 'W401': ["沈欣怡", "巩沛铭"] },  // 第 1 周 周五
    { 'W401': ["尚湉湉", "李颜汐"] },  // 第 2 周 周一
    { 'W401': ["李函菲", "钟雨珊"] },  // 第 2 周 周二
    { 'W401': ["张俊哲", "沈默"] },    // 第 2 周 周三
    { 'W401': ["徐文浩", "王鹏云"] },  // 第 2 周 周四
    { 'W401': ["王士涵", "刘艺泽"] },  // 第 2 周 周五
    { 'W401': ["温睿杰", "李轩宁"] },  // 第 3 周 周一
    { 'W401': ["宋思咏", "马浩哲"] },  // 第 3 周 周二
    { 'W401': ["梁承浩", "宫紫卿"] },  // 第 3 周 周三
    { 'W401': ["李湘淮", "李牧其"] },  // 第 3 周 周四
    { 'W401': ["冯子宸"] },            // 第 3 周 周五
];

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
// console.log(dayjs('2026-06-01').businessDiff(dayjs('2026-05-04')), dayjs().businessDiff(dayjs('2026-05-04')));

console.log(123456789,dayjs("2026-06-01 00:00:01").businessDiff(dayjs('2026-05-31  00:00:01')))
// console.log(getAllDutyInfo(dayjs('2026-05-27'), {
//     groups: DUTY_GROUPS,
//     day1: dayjs('2026-05-04')
// }))

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
