import {Player} from "@/components/types";
import {BAR_COORDS, CHECKER_RADIUS, DEFAULT_CHECKERS, DIRECTION, POINT_COORDS} from "@/lib/boardData";

export const togglePlayer = (player: Player): Player => {
    return player === 'first' ? 'second' : 'first';
}

export const getRealPoint = (point: string, player: Player): string => {
    if (player === "second" && point !== "Bar") return String(25 - Number(point));
    return point;
}

export const getDirection = (point: string, player: Player) => {
    if (point === "Bar") return DIRECTION[player];
    if (Number(point) < 13) return -1;
    return 1;
}

export const calculateCordY = (y: number, index: number, direction: number): number => y + index * direction * (CHECKER_RADIUS * 1.1)

export const generateDefaultCheckersData = () => {
    const checkers = [];
    let idCounters: Record<Player, number> = {first: 0, second: 0};
    for (const player of ["first", "second"] as Player[]) {
        const entries = Object.entries(DEFAULT_CHECKERS[player]).filter(
            ([key]) => key === "Bar" || /^[0-9]+$/.test(key)
        );

        for (const [point, count] of entries) {
            const n = Number(count);
            let realPoint = point;
            let direction: 1 | -1 = 1;

            if (player === "second" && point !== "Bar") realPoint = String((25 - Number(point)) % 25);
            if (Number(realPoint) < 13) direction = -1;
            if (point === "Bar") direction = DIRECTION[player];

            const {x, y} = point === "Bar" ? BAR_COORDS[player] : POINT_COORDS[realPoint];
            const distanceFromCenter = Math.abs(12.5 - Number(realPoint));

            for (let i = 0; i < n; i++) {
                checkers.push({
                    id: `${player}-${idCounters[player]++}`,
                    player,
                    index: i,
                    x,
                    y: calculateCordY(y, i, direction),
                    direction,
                    sortOrder: distanceFromCenter + i * 0.1,
                    currentPosition: realPoint,
                    check: false,
                });
            }
        }
    }
    return checkers;
}