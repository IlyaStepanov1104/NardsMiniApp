import Image from "next/image";
import styles from "./page.module.css";
import Board from "@/components/Board";

export default function Home() {
    return (
        <main className="min-h-screen">
            <Board/>
        </main>
    );
}
