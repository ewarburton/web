function generateMAProgram(X, Y) {
    // Seeded RNG using X
    let seed = X;
    function rand() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
    function randvar(h) {
        let localSeed = (h * 9301 + 49297) % 233280;
        return localSeed / 233280;
    }

    let instructions = [];
    let num_instructions = rand()*2 + Y; // scales with MA(Y), more instructions for higher Y

    for (let i = 1; i <= num_instructions; i++) {
        let choice = Math.floor(rand() * 4); // 0: inc, 1: dec, 2: if, 3: goto
        let reg = Math.floor(rand() * 2); // Register 0 or 1
        let val1 = Math.floor(rand() * 2);
        let val2 = Math.floor(rand() * 2);
        if (choice === 0) {
            instructions.push(`inc ${reg}`);
        } else if (choice === 1) {
            let target = 1 + Math.floor(rand() * num_instructions);
            instructions.push(`dec ${reg}, ${target}`);
        } else if (choice === 2) {
            let target1 = 1 + Math.floor(rand() * num_instructions);
            let target2 = 1 + Math.floor(randvar(X + i) * num_instructions);
            instructions.push(
                `cmp ${target1}, ${target2}\n` +
                `jl Less\n` +
                `mov word [X], ${val1}\n` +
                `jmp Both\n` +
                `Less:\n` +
                `mov word [X], ${val2}\n` +
                `Both:`
            );
        } else {
            let target = 1 + Math.floor(rand() * num_instructions);
            instructions.push(`goto ${target}`);
        }
    }

    // Ensure program ends by halting or looping to an end state
    instructions.push(`halt`);

    return instructions.join("\n");
}

// DOM interaction
window.onload = function() {
    const btn = document.getElementById('generateBtn');
    btn.onclick = function() {
        const X = parseInt(document.getElementById('inputX').value, 10);
        const Y = parseInt(document.getElementById('inputY').value, 10);
        const result = generateMAProgram(X, Y);
        document.getElementById('output').textContent = result;
    };
    // Optionally, generate on load
    btn.click();
};