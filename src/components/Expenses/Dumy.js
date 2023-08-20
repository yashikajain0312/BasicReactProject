import React from 'react'

function Dumy(props) {
    const {
    setAllItems,
    allItems,
    } = props;

    console.log("dummy allitems", allItems);
    const dummyButtonHandler = () => {
      setAllItems("in dummy component")
    }

  return (
    <div>
        <button onClick={dummyButtonHandler}>Dummy</button>
    </div>
  )
}

export default Dumy