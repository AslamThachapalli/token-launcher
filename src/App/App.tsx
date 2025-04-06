import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { LauncherForm } from "../components/LauncherForm";

import "./App.css";

export function App() {
    return (
        <div className="app-container">
            <Header />
            <LauncherForm />
            <Footer />
        </div>
    );
}

export default App;
