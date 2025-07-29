"use client";
import {useEffect, useState} from "react";
import {Checker} from "@/components/Checker";
import DiceRoll from "@/components/DiceRoll";
import {calculateCordY, generateDefaultCheckersData, getDirection, getRealPoint, togglePlayer} from "@/lib/helpers";
import {BAR_COORDS, POINT_COORDS} from "@/lib/boardData";

type Player = "first" | "second";

interface PlayerInfo {
    name: string;
    score: number;
}

interface GameData {
    "first": PlayerInfo,
    "second": PlayerInfo,
    "point_match": 1,
    "turns": Turn[]
}

interface Move {
    "from": string,
    "to": string,
    "captured": boolean
}

interface Turn {
    "turn": Player,
    "dice": [
        number,
        number
    ],
    "cube_owner": null | Player,
    "cube_value": number,
    "moves": Move[]
}

type CheckerData = {
    id: string;
    player: Player;
    index: number;
    x: number;
    y: number;
    direction: 1 | -1;
    sortOrder: number;
    currentPosition: string;
    check: boolean;
    delay?: number;
};


export default function Board() {
    const [data, setData] = useState<GameData | null>(null);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [checkers, setCheckers] = useState<CheckerData[]>(generateDefaultCheckersData());

    useEffect(() => {
        fetch("/game.json")
            .then((res) => res.json())
            .then(setData);
    }, []);

    useEffect(() => {
        if (!data) return;
        const turn = data.turns[currentTurn];
        if (!turn) return;

        checkers.map(checker => checker.check = false)

        let i = 0;

        const player = turn.turn;
        for (let {from, to, captured} of turn.moves) {
            from = getRealPoint(from, player);
            to = getRealPoint(to, player);

            if (captured) {
                const otherPlayer = togglePlayer(player);
                const foundChecker = checkers.find((element) => element.currentPosition === to && element.player === otherPlayer);
                const maxIndex = checkers.reduce((acc: CheckerData | undefined, current) => {
                    return current.index > (acc?.index ?? -Infinity) && current.currentPosition === 'Bar' && current.player === otherPlayer ? current : acc;
                }, undefined)?.index || -1;
                console.log("%c 1 --> Line: 84||Board.tsx\n maxIndex: ","color:#f0f;", maxIndex);

                if (foundChecker) {
                    foundChecker.currentPosition = 'Bar';
                    foundChecker.x = BAR_COORDS[otherPlayer].x;
                    foundChecker.index = maxIndex + 1;
                    foundChecker.y = calculateCordY(BAR_COORDS[otherPlayer].y, maxIndex + 1, getDirection(to, player));
                    foundChecker.check = true;
                    foundChecker.delay = i * 0.1;
                    i++;
                }
            }

            const currentChecker = checkers.reduce((acc: CheckerData | undefined, current) => {
                if (Number(from) < 13) {
                    return current.y < (acc?.y ?? Infinity) && current.currentPosition === from && current.player === player ? current : acc;
                }
                return current.y > (acc?.y ?? -Infinity) && current.currentPosition === from && current.player === player ? current : acc;
            }, undefined);

            const maxIndex = checkers.reduce((acc: CheckerData | undefined, current) => {
                return current.index > (acc?.index ?? -Infinity) && current.currentPosition === to && current.player === player ? current : acc;
            }, undefined)?.index ?? -1;

            if (currentChecker) {
                currentChecker.currentPosition = to;
                currentChecker.x = POINT_COORDS[to].x;
                currentChecker.index = maxIndex + 1;
                currentChecker.y = calculateCordY(POINT_COORDS[to].y, maxIndex + 1, getDirection(to, player));
                currentChecker.check = true;
                currentChecker.delay = i * 0.1;
                i++;
            }
        }
    }, [currentTurn, data]);


    if (!data) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <span className="loader"></span>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-[800px] aspect-[1280/1086] mx-auto mt-4 p-2">
            <div className="header">
                <div className="header_item justify-start">
                    <div className="checker checker--first">
                        {data.turns[currentTurn - 1]?.turn === 'first' && (
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 48 48">
                                <path fill="#43A047" d="M40.6 12.1L17 35.7 7.4 26.1 4.6 29 17 41.3 43.4 14.9z"></path>
                            </svg>)}
                    </div>
                    <div className="score">{data.first.score}</div>
                </div>
                <div className="font-sans p-2 text-lg">:</div>
                <div className="header_item justify-end">
                    <div className="score">{data.second.score}</div>
                    <div className="checker checker--second">
                        {data.turns[currentTurn - 1]?.turn === 'second' && (
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100"
                                 viewBox="0 0 48 48">
                                <path fill="#43A047" d="M40.6 12.1L17 35.7 7.4 26.1 4.6 29 17 41.3 43.4 14.9z"></path>
                            </svg>)}
                    </div>
                </div>
                <div className="name text-left">{data.first.name}</div>
                <div className="text-center">Матч до {data.point_match}</div>
                <div className="name text-right">{data.second.name}</div>
            </div>

            <div className="board">
                {checkers.map((checker) => (
                    <Checker key={checker.id} {...checker} />
                ))}
            </div>

            <DiceRoll dice={data.turns[currentTurn - 1]?.dice.length ? data.turns[currentTurn - 1].dice : [0, 0]}/>

            <div className="header">
                <button
                    onClick={() => setCurrentTurn((t) => Math.max(t - 1, 0))}
                    className="mt-4 rounded-md w-full bg-slate-800 py-2 px-4 text-white ml-2"
                >
                    Назад
                </button>
                <span/>
                <button
                    onClick={() => setCurrentTurn((t) => Math.min(t + 1, data.turns.length - 1))}
                    className="mt-4 rounded-md w-full bg-slate-800 py-2 px-4 text-white ml-2"
                >
                    Вперед
                </button>
            </div>
        </div>
    );
}
