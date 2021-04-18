import { Test } from './components/test/test';

type AppComponent = () => JSX.Element;

export const App: AppComponent = () => (
    <div>
        <Test />
    </div>
);
