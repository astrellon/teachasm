;(function()
{
    var opCodeCounter = 0;

    var moveRI = ++opCodeCounter;
    var moveRR = ++opCodeCounter;

    var moveRP = ++opCodeCounter;
    var movePR = ++opCodeCounter;

    var addRI = ++opCodeCounter;
    var addRR = ++opCodeCounter;
    
    var subtractRI = ++opCodeCounter;
    var subtractRR = ++opCodeCounter;
    
    var multiplyRI = ++opCodeCounter;
    var multiplyRR = ++opCodeCounter;
    
    var compareRI = ++opCodeCounter;
    var compareRR = ++opCodeCounter;
    
    var jumpL = ++opCodeCounter;
    var jumpEqualsL = ++opCodeCounter;
    var jumpNotEqualsL = ++opCodeCounter;
    var jumpLessThanL = ++opCodeCounter;
    var jumpLessThanEqualL = ++opCodeCounter;
    var jumpGreaterThanL = ++opCodeCounter;
    var jumpGreaterThanEqualL = ++opCodeCounter;
    
    var callL = ++opCodeCounter;
    var returnV = ++opCodeCounter;

    var opCodes = {
        moveRI, moveRR, 
        moveRP, movePR,

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

    var fn = SimpleCpu.prototype;
    fn.init = function(memorySize, registerSize)
    {
        this.programCounter = 0;
        this.memory = new Uint8Array(memorySize);
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
        var instruction = this.nextInt8();

        var arg1, arg2;
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
                this.setRegister(arg1, this.memory[this.registers[arg2]]);
                break;
            case movePR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                setMemory(this.registers[arg1], this.registers[arg2]);
                break;
            // }}}

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
    fn.setMemory = function(address, value)
    {
        this.memory[address] = value;
    }

    fn.nextInt8 = function()
    {
        return this.instructions[this.programCounter++];
    }
    fn.nextInt16 = function()
    {
        var byte1 = this.instructions[this.programCounter++];
        var byte2 = this.instructions[this.programCounter++];
        return byte2 << 8 | byte1;
    }
    fn.nextInt32 = function()
    {
        var byte1 = this.instructions[this.programCounter++];
        var byte2 = this.instructions[this.programCounter++];
        var byte3 = this.instructions[this.programCounter++];
        var byte4 = this.instructions[this.programCounter++];
        return byte4 << 24 | byte3 << 16 | byte2 << 8 | byte1;
    }

    window.simpleCpu = SimpleCpu;

})();
