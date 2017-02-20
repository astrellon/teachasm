;(function()
{
    function SimpleCompiler()
    {
        this.ast = new window.simpleAst();
        this.variables = {};
        this.memCounter = 0;
        this.registers = [];
        this.numRegisters = 8;
        this.registerAccessCounter = 1;
        this.conditionCounter = 1;

        for (var i = 0; i < this.numRegisters; i++)
        {
            this.registers.push(new Register(i));
        }

        this.output = [];
    }
    var fn = SimpleCompiler.prototype;

    fn.create = function()
    {
        var sast = window.simpleAst;
        var value = new sast.immediateValue('int', 5);
        var setVar = new sast.getVar('', 'x');
        var assign = new sast.assign(setVar, value);

        this.ast.rootNodes.push(assign);

        value = new sast.immediateValue('int', 8);
        setVar = new sast.getVar('', 'y');
        assign = new sast.assign(setVar, value);
        
        this.ast.rootNodes.push(assign);
        
        var getVar = new sast.getVar('', 'x');
        var add = new sast.add(setVar, getVar);
        
        this.ast.rootNodes.push(add);

        var equals = sast.compare.equals(getVar, value);
        var loopBody = new sast.statement();
        var one = new sast.immediateValue('int', 1);
        loopBody.nodes.push(new sast.add(getVar, one));
        var loop = new sast.loop(equals, loopBody);

        this.ast.rootNodes.push(loop);
    }

    fn.getVariable = function(fullname)
    {
        var result = this.variables[fullname];
        if (!result)
        {
            result = this.variables[fullname] = new Variable(fullname, this.memCounter++);
        }
        return result;
    }
    fn.getRegister = function(variable)
    {
       for (var i = 0; i < this.registers.length; i++)
       {
           var register = this.registers[i];
           if (register.variable === variable)
           {
               register.lastAccess = this.registerAccessCounter++;
               return register;
           }
       }

       return null;
    }
    fn.getOldestRegister = function()
    {
        var min = null;
        for (var fullname in this.registers)
        {
            var register = this.registers[fullname];
            if (min == null || register.lastAccess < min.lastAccess)
            {
                min = register;
            }
        }
        return min;
    }

    fn.compile = function()
    {
        this.output = [];

        for (var i = 0; i < this.ast.rootNodes.length; i++)
        {
            var node = this.ast.rootNodes[i];
            this.compileNode(node);
        }

        console.log('Output: ', this.output.join('\n'));
    }

    fn.compileNode = function(node)
    {
        if (node instanceof simpleAst.assign)
        {
            var register = this.compileGetNode(node.destNode);
            this.output.push('MOV r' + register.registerNumber + ' ' + this.compileValueNode(node.valueNode));
            return register;
        }
        if (node instanceof simpleAst.add)
        {
            var register = this.compileGetNode(node.destNode);
            this.output.push('ADD r' + register.registerNumber + ' ' + this.compileValueNode(node.valueNode));
            return register;
        }
        if (node instanceof simpleAst.condition)
        {
            var label = 'condition_' + (this.conditionCounter++) + ':';
            this.compileCompareNode(node.compareNode);
            this.output.push(this.getCompareJump(node.compareNode) + ' ' + label);
            this.compileNode(node.trueNode);
            this.output.push(label);
            return register;
        }
        if (node instanceof simpleAst.compare)
        {
            this.compileCompareNode(node);
            return node;
        }
        if (node instanceof simpleAst.getVar)
        {
            return this.compileGetNode(node);
        }
        if (node instanceof simpleAst.statement)
        {
            var result = null;
            for (var i = 0; i < node.nodes.length; i++)
            {
                result = this.compileNode(node.nodes[i]);
            }
            return result;
        }
        if (node instanceof simpleAst.loop)
        {
            var counter = this.conditionCounter++;
            var startLabel = 'loop_start_' + counter + ':';
            var endLabel = 'loop_end_' + counter + ':';

            this.output.push(startLabel);
            this.compileCompareNode(node.compareNode);
            this.output.push(this.getCompareJump(node.compareNode) + ' ' + endLabel);
            this.compileNode(node.loopBody);
            this.output.push('JMP ' + startLabel);
            this.output.push(endLabel);
            return register;
        }

        throw new Error('Unknown node! ' + node);
    }
    fn.compileCompareNode = function(node)
    {
        var value1 = this.compileValueNode(node.node1);
        var value2 = this.compileValueNode(node.node2);
        this.output.push('CMP ' + value1 + ' ' + value2);
    }
    fn.getCompareJump = function(node)
    {
        switch (node.comparison)
        {
            case 'equals': return 'JEQ';
            case 'notEquals': return 'JNEQ';
        }

        throw new Error('Unknown compare comparison: ' + node.comparison);
    }
    fn.compileGetNode = function(node)
    {
        var variable = this.getVariable(node.fullname);
        return this.compileGetRegister(variable);
    }
    fn.compileValueNode = function(node)
    {
        if (node instanceof simpleAst.immediateValue)
        {
            return node.value;
        }
        if (node instanceof simpleAst.getVar)
        {
            var register = this.compileGetNode(node);
            return 'r' + register.registerNumber;
        }
    }
    fn.compileGetRegister = function(variable)
    {
        var register = this.getRegister(variable);
        if (register == null)
        {
            register = this.getOldestRegister();
            if (register != null && register.variable != null)
            {
                this.output.push('MOV @' + register.variable.memoryPos + ' r' + register.registerNumber);
            }
            register.lastAccess = this.registerAccessCounter++;
            register.variable = variable;
        }
        return register;
    }

    var inMemoryPos = 'inMemory';
    var inRegisterPos = 'inRegister';
    function Variable(fullname, memoryPos)
    {
        this.fullname = fullname;
        this.position = inMemoryPos;
        this.memoryPos = memoryPos;
    }

    function Register(regNumber)
    {
        this.lastAccess = 0;
        this.variable = null;
        this.registerNumber = regNumber;
    }

    window.simpleCompiler = SimpleCompiler;

})();
