;(function()
{
    let opCodeCounter = 0;

    let moveRI = ++opCodeCounter;
    let moveRR = ++opCodeCounter;

    let moveRP = ++opCodeCounter;
    let movePR = ++opCodeCounter;

    let moveRV = ++opCodeCounter;
    let moveVR = ++opCodeCounter;

    let moveRVI = ++opCodeCounter;
    let moveVRI = ++opCodeCounter;

    let moveRPI = ++opCodeCounter;
    let movePRI = ++opCodeCounter;
    
    let moveRS = ++opCodeCounter;
    let moveSR = ++opCodeCounter;
    let moveSI = ++opCodeCounter;

    let addRI = ++opCodeCounter;
    let addRR = ++opCodeCounter;
    
    let subtractRI = ++opCodeCounter;
    let subtractRR = ++opCodeCounter;
    
    let multiplyRI = ++opCodeCounter;
    let multiplyRR = ++opCodeCounter;
    
    let divideRI = ++opCodeCounter;
    let divideRR = ++opCodeCounter;
    
    let compareRI = ++opCodeCounter;
    let compareRR = ++opCodeCounter;
    
    let jumpL = ++opCodeCounter;
    let jumpEqualsL = ++opCodeCounter;
    let jumpNotEqualsL = ++opCodeCounter;
    let jumpLessThanL = ++opCodeCounter;
    let jumpLessThanEqualL = ++opCodeCounter;
    let jumpGreaterThanL = ++opCodeCounter;
    let jumpGreaterThanEqualL = ++opCodeCounter;
    
    let pushI = ++opCodeCounter;
    let pushR = ++opCodeCounter;
    let popR = ++opCodeCounter;
    
    let callL = ++opCodeCounter;
    let returnV = ++opCodeCounter;
    
    let intL = ++opCodeCounter;
    let returniV = ++opCodeCounter;

    let stopV = ++opCodeCounter;

    let opCodes = {
        moveRI, moveRR, 
        moveRP, movePR,
        moveRV, moveVR,
        moveRPI, movePRI,
        
        moveRS, moveSR, moveSI,

        addRI, addRR,
        subtractRI, subtractRR,

        multiplyRI, multiplyRR,
        divideRI, divideRR,

        compareRI, compareRR,

        jumpL, jumpEqualsL, jumpNotEqualsL,
        jumpLessThanL, jumpLessThanEqualL,
        jumpGreaterThanL, jumpGreaterThanEqualL,

        pushI, pushR, popR,

        callL, returnV,
        intL, returniV,

        stopV
    };
    let offsets = {
        'stackPointer': 3,
        'basePointer': 2,
        'compareRegister': 1
    }

    Object.preventExtensions(opCodes);

    function SimpleCpu()
    {
        this.programCounter = 0;
        this.memory = null;
        this.registers = null;
        this.instructions = null;
        this.compareRegister = 0;
        this.stack = null;
        this.stackPointer = 0;
        this.basePointer = 0;
        this.running = false;

        Object.preventExtensions(this);
    }

    SimpleCpu.opCodes = opCodes;
    SimpleCpu.offsets = offsets;

    let fn = SimpleCpu.prototype;
    fn.init = function(numMemoryBanks, memorySize, registerSize, stackSize)
    {
        this.programCounter = 0;
        this.memory = new Array(numMemoryBanks);
        for (let i = 0; i < numMemoryBanks; i++)
        {
            this.memory[i] = new Uint8Array(memorySize);
        }

        registerSize += 3;
        this.registers = new Int32Array(registerSize);
        this.compareRegister = registerSize - offsets.compareRegister;
        this.stackPointer = registerSize - offsets.stackPointer;
        this.basePointer = registerSize - offsets.basePointer;

        this.stack = new Int32Array(stackSize);
        this.running = true;
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
        while (this.running)
        {
            this.doOneStep();
        }

        console.log(this.registers);
    }

    fn.oneStep = function()
    {
        if (this.running)
        {
            this.doOneStep();
        }
    }

    fn.reset = function()
    {
        this.programCounter = 0;
        this.running = true;

        this.registers.fill(0);
    }

    fn.doOneStep = function()
    {
        let instruction = this.nextInt8();

        let arg1, arg2, arg3;
        switch (instruction)
        {
            case stopV:
                this.running = false;
                break;

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
                this.setMemory(this.registers[arg1], this.registers[arg2], 0);
                break;

            case moveRV:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, this.memory[arg2], 0);
                break;
            case moveVR:
                arg1 = this.nextInt32();
                arg2 = this.nextInt8();
                this.setMemory(arg1, this.registers[arg2], 0);
                break;

            case moveRVI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                arg3 = this.nextInt32();
                this.setRegister(arg1, this.memory[arg2], arg3);
                break;
            case moveVRI:
                arg1 = this.nextInt32();
                arg2 = this.nextInt8();
                arg3 = this.nextInt32();
                this.setMemory(arg1, this.registers[arg2], arg3);
                break;

            case moveRPI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                arg3 = this.nextInt32();
                this.setRegister(arg1, this.memory[this.registers[arg2]], arg3);
                break;
            case movePRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                arg3 = this.nextInt32();
                this.setMemory(this.registers[arg1], this.registers[arg2], arg3);
                break;

            case moveRS:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, this.getBaseStack(arg2));
                break;
            case moveSR:
                arg1 = this.nextInt32();
                arg2 = this.nextInt8();
                this.setBaseStack(arg1, this.registers[arg2]);
                break;
            case moveSI:
                arg1 = this.nextInt32();
                arg2 = this.nextInt32();
                this.setBaseStack(arg1, arg2);
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
            
            // Subtract {{{
            case subtractRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, this.registers[arg1] - arg2);
                break;
            case subtractRR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(arg1, this.registers[arg1] - this.registers[arg2]);
                break;

            // }}}

            // Multiply {{{
            case multiplyRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, this.registers[arg1] * arg2);
                break;
            case multiplyRR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(arg1, this.registers[arg1] * this.registers[arg2]);
                break;

            // }}}

            // Divide {{{
            case divideRI:
                arg1 = this.nextInt8();
                arg2 = this.nextInt32();
                this.setRegister(arg1, Math.floor(this.registers[arg1] / arg2));
                break;
            case divideRR:
                arg1 = this.nextInt8();
                arg2 = this.nextInt8();
                this.setRegister(arg1, Math.floor(this.registers[arg1] / this.registers[arg2]));
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

            // Push / Pop {{{
            case pushR:
                arg1 = this.nextInt8();
                this.pushStack(this.registers[arg1]);
                break;
            case pushI:
                arg1 = this.nextInt32();
                this.pushStack(arg1);
                break;
            case popR:
                arg1 = this.nextInt8();
                this.setRegister(arg1, this.popStack());
                break;
            // }}}

            // Call / Return {{{
            case callL:
                arg1 = this.nextInt32();
                this.pushStack(this.programCounter);
                this.programCounter = arg1;
                break;
            case returnV:
                this.programCounter = this.popStack();
                break;
            // }}}
        }

        if (this.programCounter === this.instructions.length)
        {
            this.running = false;
        }
        else if (this.programCounter > this.instructions.length)
        {
            throw new Error('PC past end of code');
        }
    }

    fn.setRegister = function(reg, value)
    {
        console.log('Set register ', reg, ' = ', value);
        this.registers[reg] = value;
    }
    fn.setMemory = function(address, value, bank)
    {
        console.log('Set memory ', bank, address, ' = ', value);
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

    // Stack operations {{{
    fn.pushStack = function(value)
    {
        var stackPointerValue = this.getStackPointer(); 
        if (stackPointerValue >= this.stack.length - 1)
        {
            throw new Error('Stack overflow');
        }
        this.stack[stackPointerValue++] = value;
        this.setRegister(this.stackPointer, stackPointerValue)
    }
    fn.popStack = function()
    {
        var stackPointerValue = this.getStackPointer();
        if (this.stackPointerValue === 0)
        {
            throw new Error('Stack underflow');
        }
        var result = this.stack[--stackPointerValue];
        this.setRegister(this.stackPointer, stackPointerValue);
        return result;
    }
    fn.getBaseStack = function(offset)
    {
        return this.stack[this.getBasePointer() + offset];
    }
    fn.setBaseStack = function(offset, value)
    {
        this.stack[this.getBasePointer() + offset] = value;
    }
    fn.getBasePointer = function()
    {
        return this.registers[this.basePointer];
    }
    fn.getStackPointer = function()
    {
        return this.registers[this.stackPointer];
    }
    // }}}

    window.simpleCpu = SimpleCpu;

})();
