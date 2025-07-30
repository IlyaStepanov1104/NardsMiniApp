'use client';
import {FC, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {GameData} from "@/components/types";
import Board from "@/components/Board";

export const Games: FC = () => {
    const params = useSearchParams();
    const dirName = params.get('game');
    const [games, setGames] = useState<GameData[] | null>(null);
    const [currentGameIndex, setCurrentGameIndex] = useState<number>(0);
    const [isGameFinished, setIsGameFinished] = useState<boolean>(false);

    useEffect(() => {
        fetch(`/json/${dirName}/games.json`)
            .then((res) => res.json())
            .then(setGames);
    }, []);

    useEffect(() => {
        if (!games || currentGameIndex === games.length - 1) return;
        setCurrentGameIndex((t) => Math.min(t+1, games?.length - 1));
        setIsGameFinished(false);
    }, [isGameFinished]);

    if (!games) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <span className="loader"></span>
            </div>
        );
    }

    return (<Board gameData={games[currentGameIndex]} setIsGameFinished={setIsGameFinished}/>);
}