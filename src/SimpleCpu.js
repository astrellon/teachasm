;(function()
{
    let opCodeCounter = 0;

    let moveRI = ++opCodeCounter;
    let moveRR = ++opCodeCounter;

    let moveRP = ++opCodeCounter;
    let movePR = ++opCodeCounter;

    let moveRPB = ++opCodeCounter;
    let movePRB = ++opCodeCounter;

    let addRI = ++opCodeCounter;
    let addRR = ++opCodeCounter;
    
    let subtractRI = ++opCodeCounter;
    let subtractRR = ++opCodeCounter;
    
    let multiplyRI = ++opCodeCounter;
    let multiplyRR = ++opCodeCounter;
    
    let compareRI = ++opCodeCounter;
    let compareRR = ++opCodeCounter;
    
    let jumpL = ++opCodeCounter;
    let jumpEqualsL = ++opCodeCounter;
    let jumpNotEqualsL = ++opCodeCounter;
    let jumpLessThanL = ++opCodeCounter;
    let jumpLessThanEqualL = ++opCodeCounter;
    let jumpGreaterThanL = ++opCodeCounter;
    let jumpGreaterThanEqualL = ++opCodeCounter;
    
    let callL = ++opCodeCounter;
    let returnV = ++opCodeCounter;

    let opCodes = {
        moveRI, moveRR, 
        moveRP, movePR,
        moveRPB, movePRB,

        addRI, addRR,
        subtractRI, subtractRR,

        multiplyRI, multiplyRR,

        compareRI, compareRR,

        jumpL, jumpEqualsL, jumpNotEqualsL,
        jumpLessThanL, jumpLessThanEqualL,
        jumpGreaterThanL, jumpGreaterThanEqualL,

        callL,
        returnV
    };

    Object.preventExtensions(opCodes);

    function SimpleCpu()
    {
        this.programCounter = 0;
        this.memory = null;
        this.registers = null;
        this.instructions = null;
        this.compareRegister = 0;

        Object.preventExtensions(this);
    }

    SimpleCpu.opCodes = opCodes;

    let fn = SimpleCpu.prototype;
    fn.init = function(numMemoryBanks, memorySize, registerSize)
    {
        this.programCounter = 0;
        this.memory = new Array(numMemoryBanks);
        for (let i = 0; i < numMemoryBanks; i++)
        {
            this.memory[i] = new Uint8Array(memorySize);
        }
        this.registers = new Int32Array(registerSize);
        this.compareRegister = registerSize - 1;
    }

    fn.setInstructions = function(input)
    {
        this.instructions = input;
    }
    fn.getInstructions = function()
    {
        return this.instructions;
    }
    fn.getProgramCounter = function()
    {
        return this.programCounter;
    }

    fn.execute = function()
    {
        while (this.programCounter < this.instructions.length)
        {
            this.doOneStep();
        }

        console.log(this.registers);
    }

    fn.oneStep = function()
    {
        if (this.programCounter < this.instructions.length)
        {
            this.doOneStep();
        }
    }

    fn.reset = function()
    {
        this.programCounter = 0;
    }

    fn.doOneStep = function()
    {
        let instruction = this.nextInt8();

        let arg1, arg2, arg3;
        switch (instruction)
        {
            // Move {{{
            case moveRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, arg2);
                break;
            case moveRR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(arg1, this.registers[arg2]);
                break;

            case moveRP:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(arg1, this.memory[this.registers[arg2]], 0);
                break;
            case movePR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                setMemory(this.registers[arg1], this.registers[arg2], 0);
                break;

            case moveRPB:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                arg3 = this.nextInt32();
                this.setRegister(arg1, this.memory[this.registers[arg2]], arg3);
                break;
            case movePRB:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                arg3 = this.nextInt32();
                setMemory(this.registers[arg1], this.registers[arg2], arg3);
                break;
            // }}}

            // Add {{{
            case addRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, this.registers[arg1] + arg2);
                break;
            case addRR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(arg1, this.registers[arg1] + this.registers[arg2]);
                break;

            // }}}
            
            // Compare {{{
            case compareRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(this.compareRegister, this.registers[arg1] - arg2);
                break;
            case compareRR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(this.compareRegister, this.registers[arg1] - this.registers[arg2]);
                break;
            // }}}

            // Jump {{{
            case jumpL:
                this.programCounter = this.nextInt32();
                break;

            case jumpEqualsL:
                arg1 = this.nextInt32();
                if (this.registers[this.compareRegister] === 0)
                {
                    this.programCounter = arg1;
                }
                break;
            case jumpNotEqualsL:
                arg1 = this.nextInt32();
                if (this.registers[this.compareRegister] !== 0)
                {
                    this.programCounter = arg1;
                }
                break;

            case jumpLessThanL:
                arg1 = this.nextInt32();
                if (this.registers[this.compareRegister] < 0)
                {
                    this.programCounter = arg1;
                }
                break;
            case jumpLessThanEqualL:
                arg1 = this.nextInt32();
                if (this.registers[this.compareRegister] <= 0)
                {
                    this.programCounter = arg1;
                }
                break;

            case jumpGreaterThanL:
                arg1 = this.nextInt32();
                if (this.registers[this.compareRegister] > 0)
                {
                    this.programCounter = arg1;
                }
                break;
            case jumpGreaterThanEqualL:
                arg1 = this.nextInt32();
                if (this.registers[this.compareRegister] >= 0)
                {
                    this.programCounter = arg1;
                }
                break;
            // }}}
        }
    }

    fn.setRegister = function(reg, value)
    {
        console.log('Set register ', reg, ' = ', value);
        this.registers[reg] = value;
    }
    fn.setMemory = function(address, value, bank)
    {
        this.memory[bank][address] = value;
    }

    fn.nextInt8 = function()
    {
        return this.instructions[this.programCounter++];
    }
    fn.nextInt16 = function()
    {
        let byte1 = this.instructions[this.programCounter++];
        let byte2 = this.instructions[this.programCounter++];
        return byte2 << 8 | byte1;
    }
    fn.nextInt32 = function()
    {
        let byte1 = this.instructions[this.programCounter++];
        let byte2 = this.instructions[this.programCounter++];
        let byte3 = this.instructions[this.programCounter++];
        let byte4 = this.instructions[this.programCounter++];
        return byte4 << 24 | byte3 << 16 | byte2 << 8 | byte1;
    }

    window.simpleCpu = SimpleCpu;

})();
