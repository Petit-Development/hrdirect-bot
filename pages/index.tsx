import Head from "next/head";
import styles from "../styles/Home.module.css";
import { FC, useState } from "react";
import React from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  return (
    <div className={styles.container}>
      <Head>
        <title>HR Direct Resolver</title>
        <meta name="description" content="Query the HR Direct site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <a href="https://nextjs.org">HRDirect</a> Query!
        </h1>
        <p className={styles.description}>Get started by clicking bellow</p>
        Username:{" "}
        <input
          onChange={(name) => setUsername(name.target.value)}
          type="text"
        />
        Password:{" "}
        <input
          onChange={(name) => setPassword(name.target.value)}
          type="password"
        />
        <PeopleFinder
          password={password}
          username={username}
          onSubmit={setPeople}
        />
        <PersonFinder people={people} username={username} password={password} />
      </main>

      <footer className={styles.footer}>
        <a href={"mailto:joshua@petit.dev"}>
          Click here to send me an email!
        </a>
      </footer>
    </div>
  );
}

interface PeopleFinderProps {
  onSubmit: (people: string[]) => void;
  username: string;
  password: string;
}

const PeopleFinder: FC<PeopleFinderProps> = ({
  onSubmit,
  username,
  password,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryPeople = async () => {
    setIsLoading(true);
    var peopleSerialized = await fetch("/api/getNames", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"username": "${username}", "password":"${password}"}`,
    });
    var people: string[] = await peopleSerialized.json();
    onSubmit(people);
    setIsLoading(false);
  };

  return (
    <>
      <button className={styles.button} onClick={queryPeople}>
        Find available people
      </button>
      {isLoading && <p>Loading...</p>}
    </>
  );
};

interface PersonFinderProps {
  username: string;
  password: string;
  people: string[];
}

const PersonFinder: FC<PersonFinderProps> = ({
  username,
  password,
  people,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [filteredPeople, setFilteredPeople] = useState(people);
  const ref = React.createRef<HTMLSelectElement>();

  if (people.length < 1) {
    return (
      <p>Click the button above!</p>
    )
  }
  const updateFilter = (filter: string) => {
    var newFilter =
      filter === ""
        ? people
        : people.filter((person) =>
                        person.toLowerCase().includes(filter.toLowerCase())
                       );
                       setFilteredPeople(newFilter);
  };

  const queryPeople = async () => {
    var person = ref.current!.value;
    setIsLoading(true);
    var response = await fetch("/api/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"username": "${username}", "password":"${password}", "person":"${person}"}`,
    });
    var excelBlob = await response.blob();
    var file = window.URL.createObjectURL(excelBlob);
    window.location.assign(file);
    setIsLoading(false);
  };

  return (
    <>
      Filter:{" "}
      <input
        type="text"
        onChange={(filter) => updateFilter(filter.target.value)}
      />
      <select ref={ref}>
        {filteredPeople.map((person, index) => (
          <option key={index}>{person}</option>
        ))}
      </select>
      <button className={styles.button} onClick={queryPeople}>
        Download Excel Sheet
      </button>
      {isLoading && <p>Loading...</p>}
    </>
  );
};
