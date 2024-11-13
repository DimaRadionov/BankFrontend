import { useEffect, useState } from "react";

const initial_accounts = [
  {
    id: 1,
    username: "alex",
    balance: 5000,
    operations: [{ id: 1, type: "deposit", value: 5000, date: 2024 - 12 - 11 }],
  },
];

function App() {
  const [accounts, setAccounts] = useState(initial_accounts);
  const [currentAccount, setCurrentAccount] = useState(null);

  function handleSelectAccount(acc) {
    setCurrentAccount((currAcc) => (currAcc?.id === acc?.id ? null : acc));
  }

  function handleCreateAccount(account) {
    setAccounts((accounts) => [...accounts, account]);
  }

  useEffect(function () {
    async function fetchAllAccounts() {
      const res = await fetch("http://localhost:8080/api/bank/listAccounts");
      const data = await res.json();
      console.log(data.list[0]);
      setAccounts(data.list);
    }
    fetchAllAccounts();
  }, []);

  return (
    <>
      <Main>
        <Navigation>
          <CreateAccountForm onCreateAccount={handleCreateAccount} />
        </Navigation>
        <Accounts accounts={accounts} onSelection={handleSelectAccount} />
        <Movements
          movements={currentAccount ? currentAccount?.outgoingTransfers : []}
        />
        <Transfer
          currentAccount={currentAccount}
          accounts={accounts}
          setAccounts={setAccounts}
          setCurrentAccount={setCurrentAccount}
        />
        <Deposit
          currentAccount={currentAccount}
          accounts={accounts}
          setAccounts={setAccounts}
          setCurrentAccount={setCurrentAccount}
        />
        <Withdraw
          currentAccount={currentAccount}
          accounts={accounts}
          setAccounts={setAccounts}
          setCurrentAccount={setCurrentAccount}
        />
      </Main>
    </>
  );
}

function Navigation({ children }) {
  return <nav className="navigation">{children}</nav>;
}

function Main({ children }) {
  return <div className="app">{children}</div>;
}

function Accounts({ accounts, onSelection }) {
  return (
    <div className="accounts">
      {accounts.map((acc) => (
        <Account account={acc} key={acc.id} onSelection={onSelection} />
      ))}
    </div>
  );
}

function Account({ account, onSelection }) {
  return (
    <div className="movements__row" onClick={() => onSelection(account)}>
      <div className="movements__type movements__type--deposit">
        {account?.id}
      </div>
      <div className="movements__date">{account?.name}</div>
      <div className="movements__value">{account?.balance}</div>
    </div>
  );
}

function Movements({ movements }) {
  return (
    <div className="movements">
      {movements.map((movement) => (
        <Movement movement={movement} key={movement.id} />
      ))}
    </div>
  );
}

function Movement({ movement }) {
  return (
    <div className="movements__row">
      <div
        className={`movements__type ${
          movement.type === "deposit"
            ? "movements__type--deposit"
            : "movements__type--withdrawal"
        }`}
      >
        {movement.type}
      </div>
      <div className="movements__date">{movement.date}</div>
      <div className="movements__value">{movement.amount}</div>
    </div>
  );
}

function Transfer({
  currentAccount,
  setCurrentAccount,
  accounts,
  setAccounts,
}) {
  const [transferId, setTransferId] = useState(1);
  const [transferAmount, setTransferAmount] = useState(0);

  async function postTransfer(fromAccountId, toAccountId, amount) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/bank/transfer?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

    } catch (error) {
      console.error("There was an error with the transfer request:", error);
      alert("Transfer request failed. Please try again.");
    }
  }

  function handleTransfer(e) {
    e.preventDefault();
    if (!currentAccount) return;

    if (!transferId || transferId === currentAccount.id) {
      alert("Please select a valid target account.");
      return;
    }
    if (currentAccount.balance < transferAmount) {
      alert("Insufficient balance.");
      return;
    }

    const targetAccount = accounts.find((account) => account.id === transferId);
    const today = new Date().toISOString().split("T")[0];

    const newWithdrawal = {
      id: new Date().getTime(),
      type: "withdraw",
      value: -transferAmount,
      date: today,
      description: `Transfer to ${targetAccount.id}`,
    };

    const newDeposit = {
      id: new Date().getTime(),
      type: "deposit",
      value: transferAmount,
      date: today,
      description: `Transfer from ${currentAccount.id}`,
    };

    const updatedAccounts = accounts.map((account) => {
      if (account.id === currentAccount.id) {
        return {
          ...account,
          balance: account.balance - transferAmount,
          operations: [...account.outgoingTransfers, newWithdrawal],
        };
      } else if (account.id === targetAccount.id) {
        return {
          ...account,
          balance: account.balance + transferAmount,
          operations: [...account.outgoingTransfers, newDeposit],
        };
      }
      return account;
    });

    setAccounts(updatedAccounts);

    const updatedCurrentAccount = updatedAccounts.find(
      (account) => account.id === currentAccount.id
    );
    setCurrentAccount(updatedCurrentAccount);

    postTransfer(currentAccount.id, targetAccount.id, transferAmount);

    setTransferId(1);
    setTransferAmount(0);
  }

  return (
    <div className="operation operation--transfer">
      <h2>Transfer money</h2>
      <form className="form form--transfer" onSubmit={handleTransfer}>
        <input
          value={transferId}
          onChange={(e) => setTransferId(+e.target.value)}
          type="number"
          className="form__input form__input--to"
        />
        <input
          value={transferAmount}
          onChange={(e) => setTransferAmount(+e.target.value)}
          type="number"
          className="form__input form__input--amount"
        />
        <Button>&rarr;</Button>
        <label className="form__label">Transfer to</label>
        <label className="form__label">Amount</label>
      </form>
    </div>
  );
}

function Deposit({ currentAccount, setCurrentAccount, accounts, setAccounts }) {
  const [deposit, setDeposit] = useState(100);

  const today = new Date().toISOString().split("T")[0];

  function handleDeposit(e) {
    e.preventDefault();

    if (!deposit || !currentAccount) return;

    const newDeposit = {
      id: 1,
      type: "deposit",
      value: deposit,
      date: today,
    };

    const updatedAccounts = accounts.map((account) => {
      if (account.id === currentAccount.id) {
        return {
          ...account,
          balance: account.balance + deposit,
          outgoingTransfers: [...account.outgoingTransfers, newDeposit],
        };
      }
      return account;
    });

    const updatedCurrentAccount = updatedAccounts.find(
      (account) => account.id === currentAccount.id
    );
    setCurrentAccount(updatedCurrentAccount);

    setAccounts(updatedAccounts);
  }

  return (
    <div className="operation operation--loan">
      <h2>Deposit</h2>
      <form className="form form--loan" onSubmit={handleDeposit}>
        <input
          value={deposit}
          onChange={(e) => setDeposit(+e.target.value)}
          type="number"
          className="form__input form__input--loan-amount"
        />
        <Button>&rarr;</Button>
        <label className="form__label form__label--loan">Amount</label>
      </form>
    </div>
  );
}

function Withdraw({
  currentAccount,
  setCurrentAccount,
  accounts,
  setAccounts,
}) {
  const [withdraw, setWithdraw] = useState(100);

  const today = new Date().toISOString().split("T")[0];

  function handleWithdraw(e) {
    e.preventDefault();

    if (!withdraw || !currentAccount) return;

    const newWithdraw = {
      id: 1,
      type: "withdraw",
      value: withdraw,
      date: today,
    };

    const updatedAccounts = accounts.map((account) => {
      if (account.id === currentAccount.id) {
        return {
          ...account,
          balance: account.balance - withdraw,
          outgoingTransfers: [...account.outgoingTransfers, newWithdraw],
        };
      }
      return account;
    });

    const updatedCurrentAccount = updatedAccounts.find(
      (account) => account.id === currentAccount.id
    );
    setCurrentAccount(updatedCurrentAccount);

    setAccounts(updatedAccounts);
  }

  return (
    <div className="operation operation--close">
      <h2>Withdraw</h2>
      <form className="form form--loan" onSubmit={handleWithdraw}>
        <input
          value={withdraw}
          onChange={(e) => setWithdraw(+e.target.value)}
          type="number"
          className="form__input form__input--loan-amount"
        />
        <Button>&rarr;</Button>
        <label className="form__label form__label--loan">Amount</label>
      </form>
    </div>
  );
}

function CreateAccountForm({ onCreateAccount }) {
  const [name, setName] = useState("");

  function handleFormSubmit(e) {
    e.preventDefault();

    if (!name) return;
    const id = Math.floor(Math.random() * 1000) + 1;
    const newAcc = {
      id: id,
      username: name,
      balance: 0,
      operations: [],
    };

    onCreateAccount(newAcc);
    setName("");
  }

  return (
    <div>
      <form onSubmit={handleFormSubmit}>
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button>Create</Button>
      </form>
    </div>
  );
}

function Button({ children }) {
  return <button className="button">{children}</button>;
}

export default App;
