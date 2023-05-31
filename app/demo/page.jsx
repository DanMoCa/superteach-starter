'use client';


export default function Demo(){

    const handleClick = () => {
        alert('click');
    }
    
    return (
        <div>
            <h1>Potato</h1>
            <span>potato</span>
            <button onClick={handleClick}>Click me</button>
        </div>
    )
}